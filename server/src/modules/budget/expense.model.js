import mongoose from "mongoose";

// Expense data structure in MongoDB.
const expenseSchema = new mongoose.Schema({
  // Budget this expense belongs to.
  budgetId: String,
  // Expense name.
  title: String,
  // Expense amount.
  amount: Number,
  // Person who paid.
  paidBy: String,
});

export default mongoose.model("Expense", expenseSchema);