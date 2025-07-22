import express from "express";
import {
  getAllProducts,
  createProduct,
} from "../controllers/productController.js";
import { validate } from "../middlewares/validate.js";
import { createProductSchema } from "../schemas/index.js";

const router = express.Router();

router.get("/", getAllProducts);
router.post("/", validate(createProductSchema), createProduct);

export default router;
