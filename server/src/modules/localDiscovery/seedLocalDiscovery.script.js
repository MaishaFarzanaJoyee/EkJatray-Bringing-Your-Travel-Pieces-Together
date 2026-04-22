import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../../config/db.js";
import { runLocalDiscoverySeed } from "./localDiscoverySeed.service.js";

const overwriteExisting = process.argv.includes("--overwrite");

async function run() {
  await connectDB();

  const summary = await runLocalDiscoverySeed({ overwriteExisting });
  console.log("Local discovery seeding complete:", summary);

  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("Local discovery seeding failed:", error.message);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore close errors
  }
  process.exit(1);
});
