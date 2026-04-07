import express from "express";

import {
  createBudget,
  addExpense,
  getSummary
} from "./budget.controller.js";

const router = express.Router();

//creating routes
router.post("/create", createBudget);
router.post("/expense", addExpense);
router.get("/summary/:budgetId", getSummary);

export default router;