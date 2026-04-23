import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../../config/db.js";
import { runSafetyContactSeed } from "./safetySeed.service.js";

const overwriteExisting = process.argv.includes("--overwrite");

async function run() {
  await connectDB();

  const summary = await runSafetyContactSeed({ overwriteExisting });
  console.log("Safety contact seeding complete:", summary);

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("Safety contact seeding failed:", error.message);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore close errors
  }
  process.exit(1);
});
