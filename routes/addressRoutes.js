import express from "express";
import {
  getAddresses,
  addAddress,
  editAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import verifyToken from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getAddresses);

router.post("/", verifyToken, addAddress);

router.put("/:id", verifyToken, editAddress);

router.delete("/:id", verifyToken, deleteAddress);

export default router;
