import express from "express";
import {
  getAddresses,
  addAddress,
  editAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import verifyToken from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { createAddressSchema } from "../schemas/index.js";

const router = express.Router();

router.get("/", verifyToken, getAddresses);

router.post("/", verifyToken, validate(createAddressSchema), addAddress);

router.put("/:id", verifyToken, validate(createAddressSchema), editAddress);

router.delete("/:id", verifyToken, deleteAddress);

export default router;
