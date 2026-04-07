import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  tripName: String,
  totalBudget: Number,
  members: [String],
});

export default mongoose.model("Budget", budgetSchema);