import mongoose from "mongoose";

const collaboratorSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

// Budget data structure in MongoDB.
const budgetSchema = new mongoose.Schema(
  {
    //Budget ID
    budgetCode: {
      type: String,
      unique: true,
    },
    //Owner
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    // Trip name 
    tripName: String,
    // Total money for the trip.
    totalBudget: Number,
    // Collaborators
    collaborators: [collaboratorSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Budget", budgetSchema);