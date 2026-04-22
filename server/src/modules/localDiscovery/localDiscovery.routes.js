import express from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware.js";
import {
  createLocalDiscoveryItem,
  deleteLocalDiscoveryItem,
  getLocalDiscoveryItems,
  updateLocalDiscoveryItem,
} from "./localDiscovery.controller.js";

const router = express.Router();

router.get("/", getLocalDiscoveryItems);
router.get("/search", getLocalDiscoveryItems);
router.post("/", requireAuth, requireAdmin, createLocalDiscoveryItem);
router.put("/:itemId", requireAuth, requireAdmin, updateLocalDiscoveryItem);
router.delete("/:itemId", requireAuth, requireAdmin, deleteLocalDiscoveryItem);

export default router;
