import express from "express";
import {
  getAllOrders,
  createOrder,
  payOrder,
} from "../controllers/orderController.js";
import { validate } from "../middlewares/validate.js";
import { createOrderSchema } from "../schemas/index.js";
import verifyToken from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/", verifyToken, getAllOrders);
router.post("/", verifyToken, validate(createOrderSchema), createOrder);
router.patch("/pay/:id", verifyToken, payOrder);
export default router;
