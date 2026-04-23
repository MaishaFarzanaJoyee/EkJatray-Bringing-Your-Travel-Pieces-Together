import mongoose from "mongoose";
import User from "../auth/user.model.js";
import Destination from "../recommendation/destination.model.js";
import ServiceReview from "../reviewRating/review.model.js";
import Itinerary from "../itinerary/itinerary.model.js";

function normalizeString(value = "") {
  return value.toString().trim();
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => item.toString().trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function mapDestination(destination) {
  return {
    id: destination._id.toString(),
    name: destination.name,
    description: destination.description || "",
    imageUrl: destination.imageUrl || "",
    cost: destination.cost || 0,
    tags: destination.tags || [],
    coordinates: destination.coordinates || { lat: 0, lng: 0 },
    createdAt: destination.createdAt,
    updatedAt: destination.updatedAt,
  };
}

function mapUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isSuspended: Boolean(user.isSuspended),
    suspensionReason: user.suspensionReason || "",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function mapReview(review) {
  return {
    id: review._id.toString(),
    userId: review.userId,
    userName: review.userName || "",
    targetType: review.targetType,
    targetId: review.targetId,
    targetName: review.targetName,
    districtName: review.districtName || "",
    rating: review.rating,
    reviewText: review.reviewText,
    isVisible: Boolean(review.isVisible),
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export async function getAdminAnalytics(req, res) {
  try {
    const [itineraries, userCount, suspendedUsers, reviewCount, visibleReviewCount, destinationCount] = await Promise.all([
      Itinerary.find({}).lean(),
      User.countDocuments(),
      User.countDocuments({ isSuspended: true }),
      ServiceReview.countDocuments(),
      ServiceReview.countDocuments({ isVisible: true }),
      Destination.countDocuments(),
    ]);

    const totals = itineraries.reduce(
      (acc, itinerary) => {
        const transportItems = Array.isArray(itinerary.transportItems) ? itinerary.transportItems : [];
        const localItems = Array.isArray(itinerary.localItems) ? itinerary.localItems : [];
        const transportRevenue = transportItems.reduce((sum, item) => sum + toNumber(item.price, 0), 0);
        const localRevenue = localItems.reduce((sum, item) => sum + toNumber(item.price, 0), 0);

        acc.totalCheckouts += 1;
        acc.totalBookedItems += transportItems.length + localItems.length;
        acc.totalRevenue += transportRevenue + localRevenue;
        acc.transportRevenue += transportRevenue;
        acc.localRevenue += localRevenue;
        return acc;
      },
      {
        totalCheckouts: 0,
        totalBookedItems: 0,
        totalRevenue: 0,
        transportRevenue: 0,
        localRevenue: 0,
      }
    );

    return res.json({
      analytics: {
        ...totals,
        totalUsers: userCount,
        suspendedUsers,
        totalReviews: reviewCount,
        visibleReviews: visibleReviewCount,
        hiddenReviews: reviewCount - visibleReviewCount,
        totalTourSpots: destinationCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load admin analytics", error: error.message });
  }
}

export async function getAdminUsers(req, res) {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    return res.json({ users: users.map(mapUser) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load users", error: error.message });
  }
}

export async function updateUserModeration(req, res) {
  try {
    const { userId } = req.params;
    const { isSuspended, suspensionReason = "" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin" && isSuspended) {
      return res.status(400).json({ message: "Admin accounts cannot be suspended here" });
    }

    user.isSuspended = Boolean(isSuspended);
    user.suspensionReason = user.isSuspended ? normalizeString(suspensionReason) : "";
    await user.save();

    return res.json({
      message: user.isSuspended ? "User suspended successfully" : "User restored successfully",
      user: mapUser(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update user moderation", error: error.message });
  }
}

export async function getAdminReviews(req, res) {
  try {
    const reviews = await ServiceReview.find({}).sort({ createdAt: -1 }).limit(200);
    return res.json({ reviews: reviews.map(mapReview) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load moderation reviews", error: error.message });
  }
}

export async function deleteAdminReview(req, res) {
  try {
    const { reviewId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review id" });
    }

    const review = await ServiceReview.findByIdAndDelete(reviewId);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    return res.json({ message: "Review removed successfully", reviewId });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete review", error: error.message });
  }
}

export async function getAdminDestinations(req, res) {
  try {
    const destinations = await Destination.find({}).sort({ createdAt: -1 });
    return res.json({ destinations: destinations.map(mapDestination) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load destinations", error: error.message });
  }
}

export async function createAdminDestination(req, res) {
  try {
    const payload = {
      name: normalizeString(req.body.name),
      description: normalizeString(req.body.description),
      imageUrl: normalizeString(req.body.imageUrl),
      cost: toNumber(req.body.cost, 0),
      tags: normalizeList(req.body.tags),
      coordinates: {
        lat: toNumber(req.body.coordinates?.lat ?? req.body.lat, 0),
        lng: toNumber(req.body.coordinates?.lng ?? req.body.lng, 0),
      },
    };

    if (!payload.name) {
      return res.status(400).json({ message: "Destination name is required" });
    }

    const destination = await Destination.create(payload);
    return res.status(201).json({
      message: "Tour spot created successfully",
      destination: mapDestination(destination),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to create tour spot", error: error.message });
  }
}

export async function updateAdminDestination(req, res) {
  try {
    const { destinationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(destinationId)) {
      return res.status(400).json({ message: "Invalid destination id" });
    }

    const updates = { ...req.body };
    if (updates.name !== undefined) updates.name = normalizeString(updates.name);
    if (updates.description !== undefined) updates.description = normalizeString(updates.description);
    if (updates.imageUrl !== undefined) updates.imageUrl = normalizeString(updates.imageUrl);
    if (updates.cost !== undefined) updates.cost = toNumber(updates.cost, 0);
    if (updates.tags !== undefined) updates.tags = normalizeList(updates.tags);

    const lat = updates.coordinates?.lat ?? updates.lat;
    const lng = updates.coordinates?.lng ?? updates.lng;
    if (lat !== undefined || lng !== undefined) {
      updates.coordinates = {
        lat: toNumber(lat, 0),
        lng: toNumber(lng, 0),
      };
    }

    const destination = await Destination.findByIdAndUpdate(destinationId, updates, {
      new: true,
      runValidators: true,
    });

    if (!destination) {
      return res.status(404).json({ message: "Tour spot not found" });
    }

    return res.json({
      message: "Tour spot updated successfully",
      destination: mapDestination(destination),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update tour spot", error: error.message });
  }
}

export async function deleteAdminDestination(req, res) {
  try {
    const { destinationId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(destinationId)) {
      return res.status(400).json({ message: "Invalid destination id" });
    }

    const destination = await Destination.findByIdAndDelete(destinationId);
    if (!destination) {
      return res.status(404).json({ message: "Tour spot not found" });
    }

    return res.json({ message: "Tour spot deleted successfully", destinationId });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete tour spot", error: error.message });
  }
}
