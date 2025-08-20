import express from "express";
const router = express.Router();

router.get("/", getCart);

export default router;
