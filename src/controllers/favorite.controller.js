import { Favorite } from "../models/Favorite.js";

// POST /api/favorites
export const addFavorite = async (req, res, next) => {
  try {
    const { classId } = req.body;

    if (!classId) {
      return res.status(400).json({ success: false, message: "classId is required" });
    }

    const existing = await Favorite.findOne({ userId: req.user._id, classId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Already added to favorites" });
    }

    const favorite = await Favorite.create({
      userId: req.user._id,
      userEmail: req.user.email,
      classId
    });

    res.status(201).json({ success: true, message: "Added to favorites", data: favorite });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Already added to favorites" });
    }
    next(error);
  }
};

// GET /api/favorites/my-favorites
export const getMyFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate("classId")
      .sort({ createdAt: -1 });
    
    // Flatten the populated data
    const formatted = favorites.map(f => f.classId);
    
    res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

// GET /api/favorites/check/:classId
export const checkFavorite = async (req, res, next) => {
  try {
    const existing = await Favorite.findOne({ userId: req.user._id, classId: req.params.classId });
    res.status(200).json({ success: true, isFavorite: !!existing });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/favorites/:classId
export const removeFavorite = async (req, res, next) => {
  try {
    await Favorite.findOneAndDelete({ userId: req.user._id, classId: req.params.classId });
    res.status(200).json({ success: true, message: "Removed from favorites" });
  } catch (error) {
    next(error);
  }
};
