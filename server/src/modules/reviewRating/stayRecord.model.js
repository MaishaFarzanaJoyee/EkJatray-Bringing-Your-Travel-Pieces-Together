import mongoose from "mongoose";

const stayRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    userName: {
      type: String,
      default: "",
      trim: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["hotel", "transport", "localArtisan"],
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetName: {
      type: String,
      required: true,
      trim: true,
    },
    districtName: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["booked", "staying", "completed", "cancelled"],
      default: "booked",
      index: true,
    },
    checkInDate: {
      type: String,
      default: "",
      trim: true,
    },
    checkOutDate: {
      type: String,
      default: "",
      trim: true,
    },
    source: {
      type: String,
      enum: ["admin", "system"],
      default: "admin",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("StayRecord", stayRecordSchema);
