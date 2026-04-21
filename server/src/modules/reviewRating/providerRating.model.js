import mongoose from "mongoose";

const providerRatingSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      required: true,
      enum: ["hotel", "transport", "localArtisan"],
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetName: {
      type: String,
      default: "",
      trim: true,
    },
    totalRating: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

providerRatingSchema.index({ targetType: 1, targetId: 1 }, { unique: true });

export default mongoose.model("ProviderRating", providerRatingSchema);
