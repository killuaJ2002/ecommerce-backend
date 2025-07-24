import express from "express";
import {
  getAllProducts,
  createProduct,
} from "../controllers/productController.js";
import { validate } from "../middlewares/validate.js";
import { createProductSchema } from "../schemas/index.js";
import verifyToken from "../middlewares/authMiddleware.js";
const router = express.Router();

router.get("/", verifyToken, getAllProducts);
router.post("/", verifyToken, validate(createProductSchema), createProduct);

export default router;
