import express from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware.js";
import {
  createReview,
  createStayRecordByAdmin,
  deleteMyReview,
  getHotelsByDistrict,
  getMyEligibleStays,
  getMyReviews,
  getPublicProviderProfile,
  getPublicReviews,
  seedDistrictTypeReviews,
  seedSampleHotelReviews,
  updateMyReview,
} from "./reviewRating.controller.js";

const router = express.Router();

router.get("/", getPublicReviews);
router.get("/hotels-by-district", getHotelsByDistrict);
router.get("/profile/:targetType/:targetId", getPublicProviderProfile);

router.get("/my", requireAuth, getMyReviews);
router.get("/eligible/my-stays", requireAuth, getMyEligibleStays);
router.post("/", requireAuth, createReview);
router.put("/:reviewId", requireAuth, updateMyReview);
router.delete("/:reviewId", requireAuth, deleteMyReview);

router.post("/admin/stays", requireAuth, requireAdmin, createStayRecordByAdmin);
router.post("/admin/seed-sample-hotel-reviews", requireAuth, requireAdmin, seedSampleHotelReviews);
router.post("/admin/seed-district-type-reviews", requireAuth, requireAdmin, seedDistrictTypeReviews);

export default router;
