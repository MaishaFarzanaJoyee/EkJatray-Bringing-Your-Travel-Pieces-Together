import express from "express";

import {
  createBudget,
  addExpense,
  getSummary
} from "./budget.controller.js";

// Create a router for budget APIs.
const router = express.Router();

// Route for creating a budget.
router.post("/create", createBudget);

// Route for adding one expense.
router.post("/expense", addExpense);

// Route for showing budget summary.
router.get("/summary/:budgetId", getSummary);

export default router;