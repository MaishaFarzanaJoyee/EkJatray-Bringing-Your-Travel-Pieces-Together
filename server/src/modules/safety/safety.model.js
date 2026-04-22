import mongoose from "mongoose";

const safetyContactSchema = new mongoose.Schema(
  {
    destination: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["tourist-police", "hospital", "guide", "embassy", "transport-help", "general-emergency"],
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    organization: {
      type: String,
      default: "",
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhone: {
      type: String,
      default: "",
      trim: true,
    },
    whatsapp: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    languages: {
      type: [String],
      default: [],
    },
    verified: {
      type: Boolean,
      default: true,
    },
    available24Hours: {
      type: Boolean,
      default: false,
    },
    supportsSos: {
      type: Boolean,
      default: false,
    },
    supportsInquiry: {
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

safetyContactSchema.index({ destination: 1, category: 1, priority: 1 });

export default mongoose.model("SafetyContact", safetyContactSchema);
