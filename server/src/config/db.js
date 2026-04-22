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
    const isSrvLookupError = err?.code === "ECONNREFUSED" && err?.syscall === "querySrv";
    const message = isSrvLookupError
      ? "MongoDB SRV lookup failed. Check MONGO_URI and your network/DNS access to MongoDB Atlas."
      : `MongoDB connection failed: ${err.message}`;

    console.error(message);
    throw err;
  }
};

export default connectDB;
