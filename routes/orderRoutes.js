import express from "express";
import {
  getAllOrders,
  getUserOrders,
  createOrder,
  payOrder,
} from "../controllers/orderController.js";
import { validate } from "../middlewares/validate.js";
import { createOrderSchema } from "../schemas/index.js";
import verifyToken from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdmin.js"; // protect admin routes

const router = express.Router();

/**
 * Admin: list all orders (supports optional filters like ?status=...&page=...).
 * Protected by verifyToken + isAdmin.
 */
router.get("/", verifyToken, isAdmin, getAllOrders);

/**
 * Customer: list only the logged-in user's orders.
 * Optional ?status=PENDING|PURCHASED|CANCELLED
 */
router.get("/my", verifyToken, getUserOrders);

/**
 * Create an order (from client-provided items or from server-side cart logic).
 * Authenticated users only.
 */
router.post("/", verifyToken, validate(createOrderSchema), createOrder);

/**
 * Pay for an order (id param). Authenticated user only; controller verifies ownership.
 */
router.patch("/pay/:id", verifyToken, payOrder);

export default router;
