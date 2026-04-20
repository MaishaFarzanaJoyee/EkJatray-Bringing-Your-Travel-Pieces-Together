import bcrypt from "bcryptjs";
import User from "../auth/user.model.js";
import ServiceReview from "./review.model.js";
import StayRecord from "./stayRecord.model.js";
import ProviderRating from "./providerRating.model.js";
import { bangladeshDistricts } from "./districtList.js";

const typeLabelMap = {
  hotel: "Hotel",
  transport: "Transportation",
  localArtisan: "Local Artisan",
};

const reviewTextByType = {
  hotel: [
    "Room was clean and check-in was smooth. Staff were helpful during our stay.",
    "Good location and calm environment. Service was quick whenever we asked for support.",
    "Comfortable stay with decent breakfast and tidy facilities. Worth the cost.",
  ],
  transport: [
    "Trip started on time and the seats were comfortable. The staff guided passengers clearly.",
    "Booking process was easy and communication before departure was helpful.",
    "Vehicle was clean and the journey felt safe. Timing was mostly accurate.",
  ],
  localArtisan: [
    "Craft quality was very good and the artisan explained materials with care.",
    "Friendly behavior and fair pricing. Product details matched what was shown.",
    "Great handmade work with attention to detail. Delivery and support were smooth.",
  ],
};

function toSafeText(value = "") {
  return value.toString().trim();
}

function slugify(value = "") {
  return toSafeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function providerName(type, district, index) {
  if (type === "hotel") {
    return index === 0 ? `${district} Grand Hotel` : `${district} City Inn`;
  }

  if (type === "transport") {
    return index === 0 ? `${district} Express Transport` : `${district} Link Transit`;
  }

  return index === 0 ? `${district} Handcraft Studio` : `${district} Artisan Collective`;
}

async function recalculateProviderRating(targetType, targetId, targetName = "") {
  const rows = await ServiceReview.find({
    targetType,
    targetId,
    isVisible: true,
  });

  const totalReviews = rows.length;
  const totalRating = rows.reduce((sum, row) => sum + Number(row.rating || 0), 0);
  const averageRating = totalReviews > 0 ? Number((totalRating / totalReviews).toFixed(2)) : 0;

  await ProviderRating.findOneAndUpdate(
    { targetType, targetId },
    {
      targetType,
      targetId,
      targetName,
      totalReviews,
      totalRating,
      averageRating,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export async function runDistrictReviewSeed(options = {}) {
  const reviewsPerType = Math.max(2, Math.min(3, Number(options.reviewsPerType) || 3));
  const overwriteExisting = Boolean(options.overwriteExisting);

  const types = ["hotel", "transport", "localArtisan"];
  const ratings = [5, 4, 3];
  const basePasswordHash = await bcrypt.hash("SeedUserPass123", 10);

  let userCount = 0;
  let stayCount = 0;
  let reviewCreatedCount = 0;
  let reviewUpdatedCount = 0;

  const touchedProviders = new Map();

  for (const district of bangladeshDistricts) {
    const districtLower = district.toLowerCase();
    const districtSlug = slugify(district);

    for (const type of types) {
      for (let i = 0; i < reviewsPerType; i += 1) {
        const providerIndex = i % 2;
        const targetId = `${type}-${districtSlug}-${providerIndex + 1}`;
        const targetName = providerName(type, district, providerIndex);

        const email = `seed.${districtSlug}.${type}.${i + 1}@ekjatray.local`;
        const name = `Seed ${district} ${typeLabelMap[type]} Reviewer ${i + 1}`;

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name,
            email,
            passwordHash: basePasswordHash,
            role: "user",
          });
          userCount += 1;
        }

        let stay = await StayRecord.findOne({
          userId: user._id.toString(),
          targetType: type,
          targetId,
          districtName: districtLower,
          source: "seed",
        });

        if (!stay) {
          stay = await StayRecord.create({
            userId: user._id.toString(),
            userEmail: user.email,
            userName: user.name,
            targetType: type,
            targetId,
            targetName,
            districtName: districtLower,
            status: "completed",
            checkInDate: "2026-03-01",
            checkOutDate: "2026-03-03",
            source: "seed",
          });
          stayCount += 1;
        }

        const reviewText = reviewTextByType[type][i % reviewTextByType[type].length];
        const nextRating = ratings[i % ratings.length];

        const existingReview = await ServiceReview.findOne({
          userId: user._id.toString(),
          stayRecordId: stay._id.toString(),
        });

        if (!existingReview) {
          await ServiceReview.create({
            userId: user._id.toString(),
            userName: user.name,
            stayRecordId: stay._id.toString(),
            targetType: type,
            targetId,
            targetName,
            districtName: districtLower,
            rating: nextRating,
            reviewText,
            isVisible: true,
            source: "seed",
          });
          reviewCreatedCount += 1;
        } else if (overwriteExisting) {
          existingReview.rating = nextRating;
          existingReview.reviewText = reviewText;
          existingReview.targetName = targetName;
          existingReview.districtName = districtLower;
          existingReview.isVisible = true;
          await existingReview.save();
          reviewUpdatedCount += 1;
        }

        touchedProviders.set(`${type}|${targetId}`, {
          targetType: type,
          targetId,
          targetName,
        });
      }
    }
  }

  for (const provider of touchedProviders.values()) {
    await recalculateProviderRating(provider.targetType, provider.targetId, provider.targetName);
  }

  return {
    districts: bangladeshDistricts.length,
    typesPerDistrict: 3,
    reviewsPerType,
    usersCreated: userCount,
    staysCreated: stayCount,
    reviewsCreated: reviewCreatedCount,
    reviewsUpdated: reviewUpdatedCount,
    totalProvidersUpdated: touchedProviders.size,
  };
}
