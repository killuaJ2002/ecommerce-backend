import express from "express";
import {
  getAllProducts,
  createProduct,
} from "../controllers/productController.js";
import { validate } from "../middlewares/validate.js";
import { createProductSchema } from "../schemas/index.js";
import verifyToken from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdmin.js";
const router = express.Router();

router.get("/", getAllProducts);
router.post(
  "/",
  verifyToken,
  isAdmin,
  validate(createProductSchema),
  createProduct
);

export default router;
