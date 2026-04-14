import mongoose from "mongoose";

// Expense data structure in MongoDB.
const expenseSchema = new mongoose.Schema(
  {
    //BudgetID
    budgetId: String,
    // Expense name.
    title: String,
    // Expense amount.
    amount: Number,
    // Person who paid.
    paidBy: String,
    // Email of the payer so collaborator totals can be computed.
    paidByEmail: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Expense", expenseSchema);