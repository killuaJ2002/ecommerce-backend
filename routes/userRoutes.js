import express from "express";
import {
  getAllUsers,
  createUser,
  loginUser,
} from "../controllers/userController.js";
import { validate } from "../middlewares/validate.js";
import { createUserSchema, loginUserSchema } from "../schemas/index.js";

const router = express.Router();

router.get("/", getAllUsers);
router.post("/signup", validate(createUserSchema), createUser);
router.post("/login", validate(loginUserSchema), loginUser);

export default router;
