import { Booking } from "../models/Booking.js";
import { Class } from "../models/Class.js";

// POST /api/bookings
export const createBooking = async (req, res, next) => {
  try {
    const { classId, transactionId } = req.body;

    if (!classId || !transactionId) {
      return res.status(400).json({ success: false, message: "classId and transactionId are required" });
    }

    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Check duplicate
    const existingBooking = await Booking.findOne({ userId: req.user._id, classId });
    if (existingBooking) {
      return res.status(409).json({ success: false, message: "You have already booked this class" });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      classId,
      className: classData.className,
      trainerId: classData.trainerId,
      trainerName: classData.trainerName,
      schedule: classData.schedule,
      price: classData.price,
      transactionId,
      paymentStatus: "paid"
    });

    // Increment bookingCount
    classData.bookingCount += 1;
    await classData.save();

    res.status(201).json({ success: true, message: "Booking successful", data: booking });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "You have already booked this class" });
    }
    next(error);
  }
};

// GET /api/bookings/my-bookings
export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/check/:classId
export const checkBooking = async (req, res, next) => {
  try {
    const existingBooking = await Booking.findOne({ userId: req.user._id, classId: req.params.classId });
    res.status(200).json({ success: true, hasBooked: !!existingBooking });
  } catch (error) {
    next(error);
  }
};
