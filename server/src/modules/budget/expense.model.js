import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  budgetId: String,
  title: String,
  amount: Number,
  paidBy: String,
});

export default mongoose.model("Expense", expenseSchema);