import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../auth/user.model.js";
import ServiceReview from "./review.model.js";
import StayRecord from "./stayRecord.model.js";
import ProviderRating from "./providerRating.model.js";
import { runDistrictReviewSeed } from "./reviewSeed.service.js";

const REVIEW_ALLOWED_STATUS = ["booked", "staying", "completed"];

function toSafeText(value = "") {
  return value.toString().trim();
}

function toSafeRating(value) {
  const next = Number(value);
  return Number.isNaN(next) ? 0 : next;
}

async function recalculateProviderRating(targetType, targetId, targetName = "") {
  const reviews = await ServiceReview.find({
    targetType,
    targetId,
    isVisible: true,
  });

  const totalReviews = reviews.length;
  const totalRating = reviews.reduce((sum, row) => sum + Number(row.rating || 0), 0);
  const averageRating = totalReviews > 0 ? Number((totalRating / totalReviews).toFixed(2)) : 0;

  const summary = await ProviderRating.findOneAndUpdate(
    { targetType, targetId },
    {
      targetType,
      targetId,
      targetName,
      totalReviews,
      totalRating,
      averageRating,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return summary;
}

async function getEligibleStayForUser({ stayRecordId, userId, targetType, targetId }) {
  if (!stayRecordId || !mongoose.Types.ObjectId.isValid(stayRecordId)) {
    return null;
  }

  const stay = await StayRecord.findOne({
    _id: stayRecordId,
    userId,
    status: { $in: REVIEW_ALLOWED_STATUS },
  });

  if (!stay) {
    return null;
  }

  if (toSafeText(stay.targetType) !== toSafeText(targetType)) {
    return null;
  }

  if (toSafeText(stay.targetId) !== toSafeText(targetId)) {
    return null;
  }

  return stay;
}

export async function getPublicReviews(req, res) {
  try {
    const { targetType = "", targetId = "", districtName = "", limit = "30" } = req.query;

    const query = { isVisible: true };

    if (targetType) {
      query.targetType = targetType;
    }

    if (targetId) {
      query.targetId = targetId;
    }

    if (districtName) {
      query.districtName = toSafeText(districtName).toLowerCase();
    }

    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 30));

    const reviews = await ServiceReview.find(query).sort({ createdAt: -1 }).limit(safeLimit);

    return res.json({ reviews });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getHotelsByDistrict(req, res) {
  try {
    const district = toSafeText(req.query.districtName).toLowerCase();

    if (!district) {
      return res.status(400).json({ message: "districtName is required" });
    }

    const hotels = await ServiceReview.aggregate([
      {
        $match: {
          isVisible: true,
          targetType: "hotel",
          districtName: district,
        },
      },
      {
        $group: {
          _id: "$targetId",
          targetId: { $first: "$targetId" },
          targetName: { $first: "$targetName" },
          districtName: { $first: "$districtName" },
          totalReviews: { $sum: 1 },
          averageRating: { $avg: "$rating" },
        },
      },
      {
        $project: {
          _id: 0,
          targetId: 1,
          targetName: 1,
          districtName: 1,
          totalReviews: 1,
          averageRating: { $round: ["$averageRating", 2] },
        },
      },
      { $sort: { averageRating: -1, totalReviews: -1, targetName: 1 } },
    ]);

    return res.json({ hotels });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getPublicProviderProfile(req, res) {
  try {
    const { targetType, targetId } = req.params;

    const ratingSummary = await ProviderRating.findOne({ targetType, targetId });
    const reviews = await ServiceReview.find({ targetType, targetId, isVisible: true })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.json({
      profile: {
        targetType,
        targetId,
        targetName: ratingSummary?.targetName || reviews[0]?.targetName || "",
        averageRating: ratingSummary?.averageRating || 0,
        totalReviews: ratingSummary?.totalReviews || 0,
      },
      reviews,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getMyEligibleStays(req, res) {
  try {
    const userId = req?.user?.userId;

    const stays = await StayRecord.find({
      userId,
      status: { $in: REVIEW_ALLOWED_STATUS },
    }).sort({ updatedAt: -1 });

    return res.json({ stays });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getMyBookingsForReview(req, res) {
  try {
    const userId = req?.user?.userId;

    const bookings = await StayRecord.find({
      userId,
      targetType: { $in: ["hotel", "transport"] },
      status: { $in: REVIEW_ALLOWED_STATUS },
    }).sort({ updatedAt: -1 });

    const stayIds = bookings.map((row) => row._id.toString());
    const reviews = await ServiceReview.find({
      userId,
      stayRecordId: { $in: stayIds },
    });

    const reviewMap = new Map(reviews.map((row) => [row.stayRecordId, row]));

    const enriched = bookings.map((booking) => {
      const stayId = booking._id.toString();
      const review = reviewMap.get(stayId) || null;

      return {
        ...booking.toObject(),
        stayRecordId: stayId,
        canReview: booking.status !== "cancelled",
        review: review
          ? {
              id: review._id.toString(),
              rating: review.rating,
              reviewText: review.reviewText,
            }
          : null,
      };
    });

    return res.json({ bookings: enriched });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function getMyReviews(req, res) {
  try {
    const userId = req?.user?.userId;
    const reviews = await ServiceReview.find({ userId }).sort({ createdAt: -1 });
    return res.json({ reviews });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function createReview(req, res) {
  try {
    const userId = req?.user?.userId;
    const userName = req?.user?.name || req?.user?.email || "Traveler";

    const {
      stayRecordId,
      targetType,
      targetId,
      targetName,
      rating,
      reviewText,
    } = req.body;

    if (!stayRecordId || !targetType || !targetId || !targetName || !reviewText) {
      return res.status(400).json({ message: "Please provide all review fields" });
    }

    const safeRating = toSafeRating(rating);
    if (safeRating < 1 || safeRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const stay = await getEligibleStayForUser({
      stayRecordId,
      userId,
      targetType,
      targetId,
    });

    if (!stay) {
      return res.status(403).json({
        message: "Only users who are staying or completed this service can review",
      });
    }

    const created = await ServiceReview.create({
      userId,
      userName,
      stayRecordId: stay._id.toString(),
      targetType: toSafeText(targetType),
      targetId: toSafeText(targetId),
      targetName: toSafeText(targetName),
      districtName: toSafeText(stay.districtName).toLowerCase(),
      rating: safeRating,
      reviewText: toSafeText(reviewText),
      isVisible: true,
      source: "manual",
    });

    const ratingSummary = await recalculateProviderRating(
      created.targetType,
      created.targetId,
      created.targetName
    );

    return res.status(201).json({
      message: "Review created successfully",
      review: created,
      ratingSummary,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "You already submitted a review for this stay record",
      });
    }

    return res.status(500).json({ message: error.message });
  }
}

export async function updateMyReview(req, res) {
  try {
    const userId = req?.user?.userId;
    const { reviewId } = req.params;
    const { rating, reviewText } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    const review = await ServiceReview.findOne({ _id: reviewId, userId });
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    if (rating !== undefined) {
      const safeRating = toSafeRating(rating);
      if (safeRating < 1 || safeRating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      review.rating = safeRating;
    }

    if (reviewText !== undefined) {
      review.reviewText = toSafeText(reviewText);
    }

    await review.save();

    const ratingSummary = await recalculateProviderRating(
      review.targetType,
      review.targetId,
      review.targetName
    );

    return res.json({
      message: "Review updated successfully",
      review,
      ratingSummary,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function deleteMyReview(req, res) {
  try {
    const userId = req?.user?.userId;
    const userRole = req?.user?.role || "user";
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    const query = userRole === "admin" ? { _id: reviewId } : { _id: reviewId, userId };
    const review = await ServiceReview.findOne(query);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    await ServiceReview.deleteOne({ _id: review._id });

    await recalculateProviderRating(review.targetType, review.targetId, review.targetName);

    return res.json({ message: "Review deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function createStayRecordByAdmin(req, res) {
  try {
    const {
      userEmail,
      targetType,
      targetId,
      targetName,
      status = "completed",
      checkInDate = "",
      checkOutDate = "",
      districtName = "",
    } = req.body;

    if (!userEmail || !targetType || !targetId || !targetName) {
      return res.status(400).json({
        message: "userEmail, targetType, targetId and targetName are required",
      });
    }

    const normalizedEmail = toSafeText(userEmail).toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found for the given email" });
    }

    const stay = await StayRecord.create({
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
      targetType: toSafeText(targetType),
      targetId: toSafeText(targetId),
      targetName: toSafeText(targetName),
      districtName: toSafeText(districtName).toLowerCase(),
      status: toSafeText(status),
      checkInDate: toSafeText(checkInDate),
      checkOutDate: toSafeText(checkOutDate),
      source: "admin",
    });

    return res.status(201).json({
      message: "Stay record created successfully",
      stay,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function seedSampleHotelReviews(req, res) {
  try {
    const sampleUsers = [
      { name: "Amina Rahman", email: "sample.amina@ekjatray.local" },
      { name: "Mahin Karim", email: "sample.mahin@ekjatray.local" },
      { name: "Tanjila Noor", email: "sample.tanjila@ekjatray.local" },
    ];

    const hotels = [
      {
        id: "hotel-sea-view-cox",
        name: "Sea View Hotel Cox's Bazar",
        districtName: "cox's bazar",
        rating: 5,
        text: "Clean rooms, fast check-in, and the beach was very close. Staff were polite and solved small issues quickly.",
      },
      {
        id: "hotel-city-inn-dhaka",
        name: "City Inn Dhaka",
        districtName: "dhaka",
        rating: 4,
        text: "Good location for work trips. Wi-Fi was stable and breakfast options were simple but fresh.",
      },
      {
        id: "hotel-hill-nest-bandarban",
        name: "Hill Nest Bandarban",
        districtName: "bandarban",
        rating: 5,
        text: "Quiet environment with a great hill view. Service felt personal and the room was tidy.",
      },
    ];

    const passwordHash = await bcrypt.hash("SamplePass123", 10);

    const createdUsers = [];
    for (const sample of sampleUsers) {
      let user = await User.findOne({ email: sample.email.toLowerCase() });
      if (!user) {
        user = await User.create({
          name: sample.name,
          email: sample.email.toLowerCase(),
          passwordHash,
          role: "user",
        });
      }
      createdUsers.push(user);
    }

    const created = [];

    for (let i = 0; i < hotels.length; i += 1) {
      const hotel = hotels[i];
      const user = createdUsers[i % createdUsers.length];

      let stay = await StayRecord.findOne({
        userId: user._id.toString(),
        targetType: "hotel",
        targetId: hotel.id,
        source: "seed",
      });

      if (!stay) {
        stay = await StayRecord.create({
          userId: user._id.toString(),
          userEmail: user.email,
          userName: user.name,
          targetType: "hotel",
          targetId: hotel.id,
          targetName: hotel.name,
          districtName: hotel.districtName,
          status: "completed",
          checkInDate: "2026-03-01",
          checkOutDate: "2026-03-03",
          source: "seed",
        });
      }

      const exists = await ServiceReview.findOne({
        userId: user._id.toString(),
        stayRecordId: stay._id.toString(),
      });

      if (!exists) {
        const review = await ServiceReview.create({
          userId: user._id.toString(),
          userName: user.name,
          stayRecordId: stay._id.toString(),
          targetType: "hotel",
          targetId: hotel.id,
          targetName: hotel.name,
          districtName: hotel.districtName,
          rating: hotel.rating,
          reviewText: hotel.text,
          isVisible: true,
          source: "seed",
        });

        created.push(review);
      }

      await recalculateProviderRating("hotel", hotel.id, hotel.name);
    }

    return res.json({
      message: "Sample hotel review data inserted",
      insertedCount: created.length,
      note: "Sample reviews are original seed text for testing.",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

export async function seedDistrictTypeReviews(req, res) {
  try {
    const { reviewsPerType = 3, overwriteExisting = false } = req.body || {};

    const summary = await runDistrictReviewSeed({
      reviewsPerType,
      overwriteExisting,
    });

    return res.json({
      message: "District and type review seed completed",
      summary,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
