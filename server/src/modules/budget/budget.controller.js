import Budget from "./budget.model.js";
import Expense from "./expense.model.js";

// Create Budget
export const createBudget = async (req, res) => {
  try {
    const budget = await Budget.create(req.body);
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add Expense
export const addExpense = async (req, res) => {
  try {
    const expense = await Expense.create(req.body);
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Summary
export const getSummary = async (req, res) => {
  try {
    const budgetId = req.params.budgetId;

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    const expenses = await Expense.find({ budgetId });

    let totalSpent = 0;
    expenses.forEach(e => {
      totalSpent += e.amount;
    });

    const remaining = budget.totalBudget - totalSpent;

    res.json({
      totalBudget: budget.totalBudget,
      totalSpent,
      remaining,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};