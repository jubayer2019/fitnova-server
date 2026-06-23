import express from "express";
import { getClasses, getFeaturedClasses, getClassById, createClass, updateClass, deleteClass, getClassAttendees } from "../controllers/class.controller.js";
import { verifyUser, verifyTrainer, verifyTrainerOrAdmin, checkBlockedStatus } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", getClasses);
router.get("/featured", getFeaturedClasses);
router.get("/:id", getClassById);

// Protected routes
router.post("/", verifyUser, verifyTrainer, checkBlockedStatus, createClass);
router.patch("/:id", verifyUser, verifyTrainerOrAdmin, checkBlockedStatus, updateClass);
router.delete("/:id", verifyUser, verifyTrainerOrAdmin, checkBlockedStatus, deleteClass);
router.get("/:id/attendees", verifyUser, verifyTrainerOrAdmin, getClassAttendees);

export default router;
