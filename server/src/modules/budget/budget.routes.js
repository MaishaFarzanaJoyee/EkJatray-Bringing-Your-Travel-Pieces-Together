import express from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";

import {
  createBudget,
  addExpense,
  getSummary,
  addCollaborator,
  getBudgetHistory,
  deleteBudget,
} from "./budget.controller.js";

// Create a router for budget APIs.
const router = express.Router();

// Route for creating a budget.
router.post("/create", requireAuth, createBudget);

// Route for adding one expense.
router.post("/expense", requireAuth, addExpense);

// Route for showing budget summary.
router.get("/summary/:budgetId", requireAuth, getSummary);

// Route for adding a collaborator to a budget.
router.post("/collaborator", requireAuth, addCollaborator);

// Route for listing user budget history.
router.get("/history", requireAuth, getBudgetHistory);

// Route for deleting a budget by ID/code.
router.delete("/:budgetId", requireAuth, deleteBudget);

export default router;