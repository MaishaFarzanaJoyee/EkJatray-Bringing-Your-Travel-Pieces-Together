import express from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware.js";
import {
  createAdminDestination,
  deleteAdminDestination,
  deleteAdminReview,
  getAdminAnalytics,
  getAdminDestinations,
  getAdminReviews,
  getAdminUsers,
  updateAdminDestination,
  updateUserModeration,
} from "./admin.controller.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/analytics", getAdminAnalytics);
router.get("/users", getAdminUsers);
router.put("/users/:userId/moderation", updateUserModeration);
router.get("/reviews", getAdminReviews);
router.delete("/reviews/:reviewId", deleteAdminReview);
router.get("/destinations", getAdminDestinations);
router.post("/destinations", createAdminDestination);
router.put("/destinations/:destinationId", updateAdminDestination);
router.delete("/destinations/:destinationId", deleteAdminDestination);

export default router;
