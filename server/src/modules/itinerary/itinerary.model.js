import mongoose from "mongoose";

const itineraryTimelineEntrySchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      required: true,
      enum: ["departure", "arrival", "activity", "rental-pickup", "note"],
    },
    itemType: {
      type: String,
      required: true,
      enum: ["transport", "vehicle-rental", "local-experience"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    destination: {
      type: String,
      default: "",
      trim: true,
    },
    startsAt: {
      type: String,
      default: "",
    },
    endsAt: {
      type: String,
      default: "",
    },
    isScheduled: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const itinerarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    passToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    tripTitle: {
      type: String,
      default: "Trip itinerary",
      trim: true,
    },
    transportItems: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    localItems: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    timelineEntries: {
      type: [itineraryTimelineEntrySchema],
      default: [],
    },
    stats: {
      transportCount: { type: Number, default: 0 },
      localCount: { type: Number, default: 0 },
      scheduledCount: { type: Number, default: 0 },
      unscheduledCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Itinerary", itinerarySchema);
