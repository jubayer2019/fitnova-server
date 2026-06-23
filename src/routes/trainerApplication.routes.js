import express from "express";
import { applyForTrainer, getMyApplicationStatus } from "../controllers/trainerApplication.controller.js";
import { verifyUser, checkBlockedStatus } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyUser, checkBlockedStatus, applyForTrainer);
router.get("/my-status", verifyUser, getMyApplicationStatus);

export default router;
