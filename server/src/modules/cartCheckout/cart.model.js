import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: true,
      enum: ["transport", "hotel", "experience"],
    },
    providerType: {
      type: String,
      required: true,
      enum: ["transport", "hotel", "localArtisan"],
    },
    providerName: {
      type: String,
      required: true,
      trim: true,
    },
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    sourceModule: {
      type: String,
      default: "manual",
      enum: ["manual", "transport", "recommendation"],
    },
    sourceId: {
      type: String,
      default: "",
      trim: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    travelDate: {
      type: String,
      default: "",
      trim: true,
    },
    route: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      default: "pending",
      enum: ["pending", "confirmed", "completed", "cancelled"],
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("UnifiedCart", cartSchema);
