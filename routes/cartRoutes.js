import express from "express";
import verifyToken from "../middlewares/authMiddleware.js";
import {
  getCart,
  addToCart,
  deleteFromCart,
  deleteCart,
} from "../controllers/cartController.js";
const router = express.Router();

router.get("/", verifyToken, getCart);
router.post("/", verifyToken, addToCart);
router.delete("/:id", verifyToken, deleteFromCart);
router.delete("/", verifyToken, deleteCart);

export default router;
