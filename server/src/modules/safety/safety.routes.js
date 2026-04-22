import express from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware.js";
import {
  createSafetyContact,
  deleteSafetyContact,
  getSafetyContacts,
  updateSafetyContact,
} from "./safety.controller.js";

const router = express.Router();

router.get("/", getSafetyContacts);
router.get("/search", getSafetyContacts);
router.post("/", requireAuth, requireAdmin, createSafetyContact);
router.put("/:contactId", requireAuth, requireAdmin, updateSafetyContact);
router.delete("/:contactId", requireAuth, requireAdmin, deleteSafetyContact);

export default router;
