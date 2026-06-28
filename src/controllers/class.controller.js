import mongoose from "mongoose";
import { Class } from "../models/Class.js";
import { Booking } from "../models/Booking.js";
import { User } from "../models/User.js";

const getPopulatedTrainer = async (cls) => {
  let trainer = cls.trainerId;
  if (!trainer || typeof trainer === 'string') {
    let trainerIdStr = typeof trainer === 'string' ? trainer : cls.trainerId;
    let user = null;
    if (trainerIdStr) {
      if (mongoose.Types.ObjectId.isValid(trainerIdStr)) {
        user = await User.findById(trainerIdStr);
      } else {
        // Find by name if it's not a valid objectId but might be a name
        user = await User.findOne({ name: trainerIdStr });
      }
    }
    if (!user && cls.trainerName) {
      user = await User.findOne({ name: cls.trainerName });
    }
    if (user) {
      trainer = {
        _id: user._id.toString(),
        name: user.name,
        image: user.image,
        specialty: user.specialty || "Fitness Trainer",
        bio: user.bio || "Passionate about helping you achieve your fitness goals."
      };
    }
  }
  return trainer || { name: cls.trainerName };
};

// GET /api/classes
export const getClasses = async (req, res, next) => {
  try {
    const { search, category, sort, page = 1, limit = 10 } = req.query;
    
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

    let sortObj = { createdAt: -1 };
    if (sort === "popular") sortObj = { bookingCount: -1, createdAt: -1 };
    if (sort === "price-asc") sortObj = { price: 1 };
    if (sort === "price-desc") sortObj = { price: -1 };

    const rawClasses = await Class.find(query)
      .populate("trainerId", "name image specialty")
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit));

    const classes = await Promise.all(rawClasses.map(async (cls) => {
      const clsObj = cls.toObject();
      clsObj.trainerId = await getPopulatedTrainer(cls);
      return clsObj;
    }));

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
    const rawClasses = await Class.find({ status: "approved" })
      .populate("trainerId", "name image specialty")
      .sort({ bookingCount: -1 })
      .limit(6);

    const classes = await Promise.all(rawClasses.map(async (cls) => {
      const clsObj = cls.toObject();
      clsObj.trainerId = await getPopulatedTrainer(cls);
      return clsObj;
    }));

    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

// GET /api/classes/:id
export const getClassById = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    const classData = await Class.findById(req.params.id).populate("trainerId", "name image specialty bio");
    if (!classData) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }
    const classObj = classData.toObject();
    classObj.trainerId = await getPopulatedTrainer(classData);

    res.status(200).json({ success: true, data: classObj });
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

    // Trainer edits push the class back to pending status for admin approval
    req.body.status = "pending";

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

    if (req.user.role !== "admin" && classData.bookingCount > 0) {
      return res.status(403).json({ success: false, message: "Cannot delete a class that has already been booked" });
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
