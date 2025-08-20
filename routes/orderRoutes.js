import express from "express";
import {
  getAllOrders,
  getUserOrders,
  createOrder,
} from "../controllers/orderController.js";
import { validate } from "../middlewares/validate.js";
import { createOrderSchema } from "../schemas/index.js";
import verifyToken from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdmin.js"; // protect admin routes

const router = express.Router();

router.get("/", verifyToken, isAdmin, getAllOrders);

router.get("/my", verifyToken, getUserOrders);

/**
 * Create an order AFTER payment success (authenticated users only).
 * This route should be called by the client after payment success or from the payment provider webhook.
 */
router.post("/", verifyToken, validate(createOrderSchema), createOrder);

export default router;
