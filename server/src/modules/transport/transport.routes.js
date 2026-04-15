import express from "express";
import { requireAdmin, requireAuth } from "../../middleware/auth.middleware.js";
import {
  createTransportTicket,
  deleteTransportTicket,
  getTransportTicketById,
  getTransportTickets,
  updateTransportTicket,
} from "./transport.controller.js";

const router = express.Router();

router.get("/search", getTransportTickets);
router.get("/", getTransportTickets);
router.get("/:ticketId", getTransportTicketById);
router.post("/", requireAuth, requireAdmin, createTransportTicket);
router.put("/:ticketId", requireAuth, requireAdmin, updateTransportTicket);
router.delete("/:ticketId", requireAuth, requireAdmin, deleteTransportTicket);

export default router;