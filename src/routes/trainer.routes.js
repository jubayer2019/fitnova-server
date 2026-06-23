import express from "express";
import { getOverview, getMyClasses, getMyPosts } from "../controllers/trainer.controller.js";
import { verifyUser, verifyTrainer } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyUser, verifyTrainer);

router.get("/overview", getOverview);
router.get("/my-classes", getMyClasses);
router.get("/my-posts", getMyPosts);

export default router;
