import mongoose from "mongoose";

// Budget data structure in MongoDB.
const budgetSchema = new mongoose.Schema({
  // Short readable ID like TRIP-1234.
  budgetCode: {
    type: String,
    unique: true,
  },
  // Trip name entered by user.
  tripName: String,
  // Total money for the trip.
  totalBudget: Number,
  // People included in this budget.
  members: [String],
});

export default mongoose.model("Budget", budgetSchema);