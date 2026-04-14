import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("Missing MONGO_URI in environment variables");
}

// Connect to MongoDB.
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    // Show success message in terminal.
    console.log("MongoDB connected");
  } catch (err) {
    // Show error if database connection fails.
    console.log(err);
  }
};

export default connectDB;