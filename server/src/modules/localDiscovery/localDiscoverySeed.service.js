import LocalDiscoveryItem from "./localDiscovery.model.js";
import { localDiscoverySeedData } from "./localDiscovery.seedData.js";

export async function runLocalDiscoverySeed({ overwriteExisting = false } = {}) {
  if (overwriteExisting) {
    await LocalDiscoveryItem.deleteMany({});
  }

  const operations = localDiscoverySeedData.map((item) => ({
    updateOne: {
      filter: {
        type: item.type,
        destination: item.destination,
        name: item.name,
      },
      update: { $set: item },
      upsert: true,
    },
  }));

  const result = await LocalDiscoveryItem.bulkWrite(operations, { ordered: false });
  const total = await LocalDiscoveryItem.countDocuments();

  return {
    seededTemplates: localDiscoverySeedData.length,
    matchedCount: result.matchedCount || 0,
    modifiedCount: result.modifiedCount || 0,
    upsertedCount: result.upsertedCount || 0,
    totalItems: total,
  };
}
