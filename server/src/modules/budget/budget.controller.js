import Budget from "./budget.model.js";
import Expense from "./expense.model.js";
import mongoose from "mongoose";

// Make a simple budget ID like TRIP-1234.
const makeSimpleBudgetCode = () => `TRIP-${Math.floor(1000 + Math.random() * 9000)}`;

// Search budget by either Mongo ID or simple budget code.
const getBudgetQuery = (idOrCode) => {
  if (mongoose.Types.ObjectId.isValid(idOrCode)) {
    return { $or: [{ _id: idOrCode }, { budgetCode: idOrCode }] };
  }
  return { budgetCode: idOrCode };
};

// Try a few times to make a unique readable code.
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

// Create budget.
export const createBudget = async (req, res) => {
  try {
    const { tripName, totalBudget, members } = req.body;

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
    // Save the new budget in database.
    const budget = await Budget.create({
      tripName,
      totalBudget,
      members: Array.isArray(members) ? members : [],
      budgetCode,
    });

    // Send a friendly success message.
    res.json({
      message: "Budget created successfully",
      budgetId: budget.budgetCode,
      tripName: budget.tripName,
      totalBudget: budget.totalBudget,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add expense.
export const addExpense = async (req, res) => {
  try {
    const { budgetId, title, amount } = req.body;

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

    // Use the real Mongo ID to connect expenses with this budget.
    const budgetObjectId = budget._id.toString();
    // Get all expenses already added.
    const expenses = await Expense.find({ budgetId: budgetObjectId });
    // Count total money already spent.
    const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
    // Check what money is left.
    const remaining = budget.totalBudget - totalSpent;

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
      ...req.body,
      budgetId: budgetObjectId,
    });

    // Send a clean success message.
    res.json({
      message: "Expense added successfully",
      budgetId: budget.budgetCode,
      title: expense.title,
      amount: expense.amount,
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

    // Get all expenses for this budget.
    const expenses = await Expense.find({ budgetId: budget._id.toString() });

    // Add all expense amounts.
    let totalSpent = 0;
    expenses.forEach(e => {
      totalSpent += e.amount;
    });

    // Calculate remaining balance.
    const remaining = budget.totalBudget - totalSpent;

    // Send summary back to frontend.
    res.json({
      budgetId: budget.budgetCode,
      totalBudget: budget.totalBudget,
      totalSpent,
      remaining,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};