import Budget from "./budget.model.js";
import Expense from "./expense.model.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

// Helper function to make trip id
const makeSimpleBudgetCode = () => `TRIP-${Math.floor(1000 + Math.random() * 9000)}`;

// Search budget by either Mongo ID or simple budget code.
const getBudgetQuery = (idOrCode) => {
  if (mongoose.Types.ObjectId.isValid(idOrCode)) {
    return { $or: [{ _id: idOrCode }, { budgetCode: idOrCode }] };
  }
  return { budgetCode: idOrCode };
};

// generate unique trip id
const createUniqueBudgetCode = async () => {
  for (let i = 0; i < 10; i += 1) {
    const code = makeSimpleBudgetCode();
    const exists = await Budget.findOne({ budgetCode: code });
    if (!exists) {
      return code;
    }
  }
  return `TRIP-${Date.now()}`;
};

const normalizeEmail = (value = "") => value.toLowerCase().trim();

const canAccessBudget = (budget, user) => {
  if (!budget || !user) {
    return false;
  }

  if (budget.ownerId === user.userId) {
    return true;
  }

  return budget.collaborators.some((c) => c.email === normalizeEmail(user.email));
};

const canManageBudget = (budget, user) => budget && user && budget.ownerId === user.userId;

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getMailTransport = () => {
  if (!isSmtpConfigured()) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE.toLowerCase() === "true"
    : port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendInviteMail = async ({ ownerName, collaboratorEmail, tripName, budgetCode }) => {
  const transporter = getMailTransport();
  if (!transporter) {
    console.warn(
      `[Invite skipped] SMTP not configured. Could not send invite to ${collaboratorEmail} for budget ${budgetCode}.`
    );
    return { sent: false, reason: "SMTP_NOT_CONFIGURED" };
  }

  const from = process.env.MAIL_FROM || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from,
    to: collaboratorEmail,
    subject: `Invitation to collaborate on ${tripName}`,
    text: `${ownerName} invited you to collaborate on the travel budget "${tripName}" (${budgetCode}). Log in to EkJatray to access it.`,
  });

  return { sent: true, messageId: info?.messageId || "" };
};

const getBudgetSpending = async (budget) => {
  const expenses = await Expense.find({ budgetId: budget._id.toString() });
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = budget.totalBudget - totalSpent;

  return {
    expenses,
    totalSpent,
    remaining,
  };
};

const buildPaidBySummary = (expenses) => {
  const totals = {};

  expenses.forEach((expense) => {
    const payer = expense.paidBy || "Unknown";
    totals[payer] = (totals[payer] || 0) + expense.amount;
  });

  return Object.entries(totals).map(([name, amount]) => ({ name, amount }));
};

// Create budget.
export const createBudget = async (req, res) => {
  try {
    const { tripName, totalBudget, collaborators } = req.body;

    // Trip name is required.
    if (!tripName) {
      return res.status(400).json({ message: "Please provide Trip Name" });
    }

    // Budget must be a real number.
    if (typeof totalBudget !== "number" || Number.isNaN(totalBudget)) {
      return res.status(400).json({ message: "Please provide Total Budget" });
    }

    // Budget cannot be zero or negative.
    if (totalBudget <= 0) {
      return res.status(400).json({ message: "Total Budget must be greater than 0" });
    }

    // Create a readable ID for the user.
    const budgetCode = await createUniqueBudgetCode();
    let uniqueCollaborators = [];

    if (Array.isArray(collaborators)) {
      //clean emails
      const cleaned = collaborators.map((email) => normalizeEmail(email));

      //remove empty values
      const valid = cleaned.filter((email) => email);

      //remove duplicates
      uniqueCollaborators = [...new Set(valid)];
    }

    const filteredCollaborators = uniqueCollaborators.filter(
      (email) => email !== normalizeEmail(req.user.email)
    );

    // Save the new budget in database.
    const budget = await Budget.create({
      tripName,
      totalBudget,
      ownerId: req.user.userId,
      collaborators: filteredCollaborators.map((email) => ({
        email,
      })),
      budgetCode,
    });

    const inviteResults = await Promise.all(
      filteredCollaborators.map((email) =>
        sendInviteMail({
          ownerName: req.user.name,
          collaboratorEmail: email,
          tripName: budget.tripName,
          budgetCode: budget.budgetCode,
        })
      )
    );

    const invitesSent = inviteResults.filter((r) => r.sent).length;
    const inviteWarnings = inviteResults.filter((r) => !r.sent).map((r) => r.reason);

    // Send a friendly success message.
    res.json({
      message: "Budget created successfully",
      budgetId: budget.budgetCode,
      tripName: budget.tripName,
      totalBudget: budget.totalBudget,
      collaborators: budget.collaborators,
      inviteStatus: {
        requested: filteredCollaborators.length,
        sent: invitesSent,
        failed: filteredCollaborators.length - invitesSent,
        warnings: inviteWarnings,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add expense.
export const addExpense = async (req, res) => {
  try {
    const { budgetId, title, amount, paidBy } = req.body;

    // Trip ID is required.
    if (!budgetId) {
      return res.status(400).json({ message: "Please provide the correct Trip-ID" });
    }

    // Expense title is required.
    if (!title) {
      return res.status(400).json({ message: "Please provide Expense Title" });
    }

    // Amount must be a real number.
    if (typeof amount !== "number" || Number.isNaN(amount)) {
      return res.status(400).json({ message: "Please provide Amount" });
    }

    // Amount cannot be zero or negative.
    if (amount <= 0) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    // Find the budget using the simple ID or Mongo ID.
    const budget = await Budget.findOne(getBudgetQuery(budgetId));
    if (!budget) {
      return res.status(404).json({ message: "Please provide the correct Trip-ID" });
    }

    if (!canAccessBudget(budget, req.user)) {
      return res.status(403).json({ message: "You do not have access to this budget" });
    }

    // Use the real Mongo ID to connect expenses with this budget.
    const budgetObjectId = budget._id.toString();
    // Get all expenses already added.
    const { expenses, totalSpent, remaining } = await getBudgetSpending(budget);
    // Count total money already spent.

    // Stop if user tries to spend more than the remaining budget.
    if (amount > remaining) {
      return res.status(400).json({
        message: "Expense exceeds the remaining budget",
        budgetId: budget.budgetCode,
        totalBudget: budget.totalBudget,
        totalSpent,
        remaining,
      });
    }

    // Save the new expense.
    const expense = await Expense.create({
      title: title.trim(),
      amount,
      budgetId: budgetObjectId,
      paidBy: paidBy?.trim() || req.user.name,
      paidByEmail: normalizeEmail(req.user.email),
    });

    // Send a clean  message
    res.json({
      message: "Expense added successfully",
      budgetId: budget.budgetCode,
      title: expense.title,
      amount: expense.amount,
      paidBy: expense.paidBy,
      remaining: remaining - expense.amount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Show summary.
export const getSummary = async (req, res) => {
  try {
    const budgetId = req.params.budgetId;

    // Find the budget first.
    const budget = await Budget.findOne(getBudgetQuery(budgetId));
    if (!budget) {
      return res.status(404).json({ message: "Please provide the correct Trip-ID" });
    }

    if (!canAccessBudget(budget, req.user)) {
      return res.status(403).json({ message: "You do not have access to this budget" });
    }

    const { expenses, totalSpent, remaining } = await getBudgetSpending(budget);
    const paidBy = buildPaidBySummary(expenses);

    // Send summary back to frontend.
    res.json({
      budgetId: budget.budgetCode,
      tripName: budget.tripName,
      totalBudget: budget.totalBudget,
      totalSpent,
      remaining,
      collaborators: budget.collaborators,
      paidBy,
      chartData: [
        { label: "Used", value: totalSpent },
        { label: "Remaining", value: remaining < 0 ? 0 : remaining },
      ],
      expenses,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addCollaborator = async (req, res) => {
  try {
    const { budgetId, email, name } = req.body;

    if (!budgetId || !email) {
      return res.status(400).json({ message: "Budget ID and collaborator email are required" });
    }

    const budget = await Budget.findOne(getBudgetQuery(budgetId));

    if (!budget) {
      return res.status(404).json({ message: "Please provide the correct Trip-ID" });
    }

    if (!canManageBudget(budget, req.user)) {
      return res.status(403).json({ message: "Only the owner can add collaborators" });
    }

    const normalizedEmail = normalizeEmail(email);

    if (normalizedEmail === normalizeEmail(req.user.email)) {
      return res.status(400).json({ message: "Owner is already part of this budget" });
    }

    const exists = budget.collaborators.some((c) => c.email === normalizedEmail);

    if (exists) {
      return res.status(409).json({ message: "Collaborator is already added" });
    }

    budget.collaborators.push({ email: normalizedEmail, name: name?.trim() || "" });
    await budget.save();

    const inviteResult = await sendInviteMail({
      ownerName: req.user.name,
      collaboratorEmail: normalizedEmail,
      tripName: budget.tripName,
      budgetCode: budget.budgetCode,
    });

    return res.json({
      message: inviteResult.sent
        ? "Collaborator added and invitation sent"
        : "Collaborator added, but invitation email could not be sent",
      budgetId: budget.budgetCode,
      collaborators: budget.collaborators,
      inviteStatus: inviteResult,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getBudgetHistory = async (req, res) => {
  try {
    const email = normalizeEmail(req.user.email);

    const budgets = await Budget.find({
      $or: [{ ownerId: req.user.userId }, { "collaborators.email": email }],
    }).sort({ createdAt: -1 });

    const history = await Promise.all(
      budgets.map(async (budget) => {
        const { totalSpent, remaining } = await getBudgetSpending(budget);
        return {
          budgetId: budget.budgetCode,
          tripName: budget.tripName,
          totalBudget: budget.totalBudget,
          totalSpent,
          remaining,
          ownerId: budget.ownerId,
          isOwner: budget.ownerId === req.user.userId,
          collaborators: budget.collaborators,
          createdAt: budget.createdAt,
        };
      })
    );

    return res.json({ history });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    const { budgetId } = req.params;

    const budget = await Budget.findOne(getBudgetQuery(budgetId));

    if (!budget) {
      return res.status(404).json({ message: "Please provide the correct Trip-ID" });
    }

    if (!canManageBudget(budget, req.user)) {
      return res.status(403).json({ message: "Only the owner can delete this budget" });
    }
//delete all expenses then delete the budget
    await Expense.deleteMany({ budgetId: budget._id.toString() });
    await budget.deleteOne();

    return res.json({ message: "Budget deleted successfully", budgetId: budget.budgetCode });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};