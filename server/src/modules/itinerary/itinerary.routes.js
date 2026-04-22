import express from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { checkoutItinerary, getItineraryById } from "./itinerary.controller.js";

const router = express.Router();

router.post("/checkout", requireAuth, checkoutItinerary);
router.get("/:itineraryId", requireAuth, getItineraryById);

export default router;
