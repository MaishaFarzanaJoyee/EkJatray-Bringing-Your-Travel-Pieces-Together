import SafetyContact from "./safety.model.js";
import { safetyContactSeedData } from "./safety.seedData.js";

export async function runSafetyContactSeed({ overwriteExisting = false } = {}) {
  if (overwriteExisting) {
    await SafetyContact.deleteMany({});
  }

  const operations = safetyContactSeedData.map((item) => ({
    updateOne: {
      filter: {
        destination: item.destination,
        category: item.category,
        name: item.name,
      },
      update: { $set: item },
      upsert: true,
    },
  }));

  const result = await SafetyContact.bulkWrite(operations, { ordered: false });
  const total = await SafetyContact.countDocuments();

  return {
    seededTemplates: safetyContactSeedData.length,
    matchedCount: result.matchedCount || 0,
    modifiedCount: result.modifiedCount || 0,
    upsertedCount: result.upsertedCount || 0,
    totalContacts: total,
  };
}
