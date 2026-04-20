import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../../config/db.js";
import { runDistrictReviewSeed } from "./reviewSeed.service.js";

const reviewsPerTypeArg = process.argv.find((arg) => arg.startsWith("--count="));
const overwriteArg = process.argv.find((arg) => arg === "--overwrite");

const reviewsPerType = reviewsPerTypeArg ? Number(reviewsPerTypeArg.split("=")[1]) : 3;
const overwriteExisting = Boolean(overwriteArg);

async function run() {
  await connectDB();

  const summary = await runDistrictReviewSeed({
    reviewsPerType,
    overwriteExisting,
  });

  console.log("District review seeding complete:", summary);

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("District review seeding failed:", error.message);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore close errors
  }
  process.exit(1);
});
