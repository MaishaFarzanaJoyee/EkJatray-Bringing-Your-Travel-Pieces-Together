import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
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
    sourceId: {
      type: String,
      default: "",
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
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
    bookingStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "confirmed", "completed", "cancelled"],
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      trim: true,
      lowercase: true,
    },
    paymentStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "paid", "failed", "cancelled"],
      index: true,
    },
    bookingStatus: {
      type: String,
      default: "pending",
      enum: ["pending", "confirmed", "completed", "cancelled"],
      index: true,
    },
    stripeSessionId: {
      type: String,
      default: "",
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("CheckoutOrder", orderSchema);
