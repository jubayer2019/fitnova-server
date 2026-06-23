import { Class } from "../models/Class.js";
import { Booking } from "../models/Booking.js";

// GET /api/classes
export const getClasses = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;
    
    let query = { status: "approved" };

    if (search) {
      query.className = { $regex: search, $options: "i" };
    }

    if (category) {
      // Support comma-separated categories if needed
      const categories = category.split(",");
      query.category = { $in: categories };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const classes = await Class.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Class.countDocuments(query);

    res.status(200).json({
      success: true,
      data: classes,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/classes/featured
export const getFeaturedClasses = async (req, res, next) => {
  try {
    const classes = await Class.find({ status: "approved" })
      .sort({ bookingCount: -1 })
      .limit(6);
    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

// GET /api/classes/:id
export const getClassById = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    // Optional: Check if private, but requirement says "Private for details if required by frontend".
    // We will leave it public for basic info, frontend usually needs it.
    res.status(200).json({ success: true, data: classData });
  } catch (error) {
    next(error);
  }
};

// POST /api/classes
export const createClass = async (req, res, next) => {
  try {
    const { className, image, category, difficultyLevel, duration, schedule, price, description } = req.body;
    
    const newClass = await Class.create({
      className,
      image,
      category,
      difficultyLevel,
      duration,
      schedule,
      price,
      description,
      trainerId: req.user._id,
      trainerName: req.user.name,
      trainerEmail: req.user.email,
      status: "pending"
    });

    res.status(201).json({ success: true, message: "Class created successfully (pending approval)", data: newClass });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/classes/:id
export const updateClass = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Admin can update anything, including status
    if (req.user.role === "admin") {
      const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
      return res.status(200).json({ success: true, message: "Class updated", data: updatedClass });
    }

    // Trainer can only update their own pending/rejected classes
    if (classData.trainerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to update this class" });
    }

    if (classData.status === "approved") {
      return res.status(403).json({ success: false, message: "Cannot edit approved classes" });
    }

    // Prevent trainer from changing status manually
    delete req.body.status;

    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: "Class updated", data: updatedClass });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/classes/:id
export const deleteClass = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (req.user.role !== "admin" && classData.trainerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this class" });
    }

    await classData.deleteOne();
    res.status(200).json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// GET /api/classes/:id/attendees
export const getClassAttendees = async (req, res, next) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    if (req.user.role !== "admin" && classData.trainerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized to view attendees" });
    }

    const bookings = await Booking.find({ classId: req.params.id }).select("userName userEmail paymentStatus createdAt");
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};
