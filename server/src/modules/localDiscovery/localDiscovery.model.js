import mongoose from "mongoose";

const localDiscoverySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["vehicle-rental", "local-experience"],
      index: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    pricingUnit: {
      type: String,
      default: "",
      trim: true,
    },
    durationHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    capacity: {
      type: Number,
      default: 1,
      min: 1,
    },
    pickupLocation: {
      type: String,
      default: "",
      trim: true,
    },
    contactPhone: {
      type: String,
      default: "",
      trim: true,
    },
    features: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    verified: {
      type: Boolean,
      default: true,
    },
    available: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 50,
      min: 1,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

localDiscoverySchema.index({ destination: 1, type: 1, category: 1, priority: -1 });

export default mongoose.model("LocalDiscoveryItem", localDiscoverySchema);
