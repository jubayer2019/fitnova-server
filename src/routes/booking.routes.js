import express from "express";
import { createBooking, getMyBookings, checkBooking } from "../controllers/booking.controller.js";
import { verifyUser, checkBlockedStatus } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyUser, checkBlockedStatus, createBooking);
router.get("/my-bookings", verifyUser, getMyBookings);
router.get("/check/:classId", verifyUser, checkBooking);

export default router;
