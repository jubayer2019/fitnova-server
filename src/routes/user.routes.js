import express from "express";
import { getMyProfile, updateMyProfile, getDashboardStats } from "../controllers/user.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyUser);

router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);
router.get("/dashboard-stats", getDashboardStats);

export default router;
