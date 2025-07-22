import express from "express";
import { getAllOrders, createOrder } from "../controllers/orderController.js";
import { validate } from "../middlewares/validate.js";
import { createOrderSchema } from "../schemas/index.js";

const router = express.Router();

router.get("/", getAllOrders);
router.post("/", validate(createOrderSchema), createOrder);

export default router;
