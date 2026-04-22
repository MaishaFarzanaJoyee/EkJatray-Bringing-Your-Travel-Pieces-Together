import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../auth/user.model.js";
import TransportTicket from "../transport/transport.model.js";
import ServiceReview from "./review.model.js";
import StayRecord from "./stayRecord.model.js";
import ProviderRating from "./providerRating.model.js";

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
          totalReviews: { $sum: 1 }, // count of reviews
          averageRating: { $avg: "$rating" },
        },
      },
      {
        $project: {
          _id: 0, // hide the default _id
          targetId: 1,
          targetName: 1, 
          districtName: 1, //1 =yes to include in results
          totalReviews: 1,
          averageRating: { $round: ["$averageRating", 2] }, // round to 2 decimals
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
    }).sort({ updatedAt: -1 }); // most recent first

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
    }).sort({ updatedAt: -1 }); // most recent first

    const stayIds = bookings.map((row) => row._id.toString());
    const reviews = await ServiceReview.find({
      userId,
      stayRecordId: { $in: stayIds }, // get all reviews for this user's stays
    });

    const reviewMap = new Map(reviews.map((row) => [row.stayRecordId, row]));

    const enriched = bookings.map((booking) => { // for each booking, find if there's a review
      const stayId = booking._id.toString();
      const review = reviewMap.get(stayId) || null;

      return { 
        //copy paste booking fields and add review info
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

    let districtName = toSafeText(stay.districtName).toLowerCase();
    if (!districtName && toSafeText(targetType) === "transport" && mongoose.Types.ObjectId.isValid(toSafeText(targetId))) {
      const ticket = await TransportTicket.findById(targetId).select("destination");
      districtName = toSafeText(ticket?.destination).toLowerCase();
    }

    const created = await ServiceReview.create({
      userId,
      userName,
      stayRecordId: stay._id.toString(),
      targetType: toSafeText(targetType),
      targetId: toSafeText(targetId),
      targetName: toSafeText(targetName),
      districtName,
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

