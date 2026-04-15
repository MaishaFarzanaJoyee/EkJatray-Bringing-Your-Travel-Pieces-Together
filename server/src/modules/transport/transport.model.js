import mongoose from "mongoose";

const transportTicketSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      required: true,
      enum: ["flight", "train", "bus"],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    operator: {
      type: String,
      required: true,
      trim: true,
    },
    origin: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    travelDate: {
      type: String,
      required: true,
      index: true,
    },
    departureTime: {
      type: String,
      required: true,
    },
    arrivalTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    seatTypes: {
      type: [String],
      default: [],
    },
    seatsAvailable: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

transportTicketSchema.index({ destination: 1, travelDate: 1, mode: 1, price: 1 });

export default mongoose.model("TransportTicket", transportTicketSchema);