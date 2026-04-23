import express from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  addAccommodationItemToCart,
  addExperienceItemToCart,
  addTransportItemToCart,
  addWellnessItemToCart,
  clearCart,
  createStripeCheckoutSession,
  getMyCart,
  getMyOrders,
  getOrderById,
  handleStripeWebhook,
  markOrderAsCompleted,
  removeCartItem,
  updateCartItem,
} from "./cartCheckout.controller.js";

const router = express.Router();

router.get("/cart", requireAuth, getMyCart);
router.post("/cart/items/transport", requireAuth, addTransportItemToCart);
router.post("/cart/items/experience", requireAuth, addExperienceItemToCart);
router.post("/cart/items/accommodation", requireAuth, addAccommodationItemToCart);
router.post("/cart/items/wellness", requireAuth, addWellnessItemToCart);
router.patch("/cart/items/:itemId", requireAuth, updateCartItem);
router.delete("/cart/items/:itemId", requireAuth, removeCartItem);
router.delete("/cart", requireAuth, clearCart);

router.post("/checkout/create-session", requireAuth, createStripeCheckoutSession);
router.get("/orders", requireAuth, getMyOrders);
router.get("/orders/:orderId", requireAuth, getOrderById);
router.patch("/orders/:orderId/complete", requireAuth, markOrderAsCompleted);

export { handleStripeWebhook };
export default router;
