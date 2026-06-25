import { Booking } from "../models/Booking.js";
import { Favorite } from "../models/Favorite.js";
import { User } from "../models/User.js";

// GET /api/users/me
export const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/me
export const updateMyProfile = async (req, res, next) => {
  try {
    const allowedUpdates = ["name", "image"];
    if (req.user.role === "trainer") {
      allowedUpdates.push("specialty", "bio", "experience");
    }
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const updated = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.status(200).json({ success: true, message: "Profile updated", data: updated });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/dashboard-stats
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalBookedClasses = await Booking.countDocuments({ userId: req.user._id });
    const totalFavorites = await Favorite.countDocuments({ userId: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        totalBookedClasses,
        totalFavorites,
        profile: {
          name: req.user.name,
          email: req.user.email,
          image: req.user.image,
          role: req.user.role,
        },
        trainerApplicationStatus: req.user.trainerApplicationStatus,
        rejectionFeedback: req.user.trainerFeedback || null
      }
    });
  } catch (error) {
    next(error);
  }
};
