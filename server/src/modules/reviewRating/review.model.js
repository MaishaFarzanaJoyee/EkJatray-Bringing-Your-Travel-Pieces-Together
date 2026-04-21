import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      default: "",
      trim: true,
    },
    stayRecordId: {
      type: String,
      required: true,
      index: true,
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    isVisible: {
      type: Boolean,
      default: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["manual", "seed"],
      default: "manual",
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ userId: 1, stayRecordId: 1 }, { unique: true });

export default mongoose.model("ServiceReview", reviewSchema);
