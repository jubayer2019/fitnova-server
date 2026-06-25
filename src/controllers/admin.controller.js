import { User } from "../models/User.js";
import { Class } from "../models/Class.js";
import { Transaction } from "../models/Transaction.js";
import { Booking } from "../models/Booking.js";
import { ForumPost } from "../models/ForumPost.js";
import { TrainerApplication } from "../models/TrainerApplication.js";
import mongoose from "mongoose";

// GET /api/admin/overview
export const getOverview = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalClasses = await Class.countDocuments();
    const totalBookedClasses = await Booking.countDocuments();
    
    const transactions = await Transaction.find({ status: "succeeded" });
    const totalRevenue = transactions.reduce((acc, curr) => acc + curr.amount, 0);

    res.status(200).json({
      success: true,
      data: { totalUsers, totalClasses, totalBookedClasses, totalRevenue }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/block
export const blockUser = async (req, res, next) => {
  try {
    const db = mongoose.connection.db;
    const update = { $set: { status: "blocked" } };
    
    // Try string ID first (BetterAuth native format)
    let result = await db.collection("user").findOneAndUpdate({ _id: req.params.id }, update, { returnDocument: "after" });
    
    // If not found and it's a valid hex string, try ObjectId (Legacy data)
    if (!result && mongoose.Types.ObjectId.isValid(req.params.id)) {
      result = await db.collection("user").findOneAndUpdate({ _id: new mongoose.Types.ObjectId(req.params.id) }, update, { returnDocument: "after" });
    }
    
    if (!result) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: "User blocked", data: result });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/unblock
export const unblockUser = async (req, res, next) => {
  try {
    const db = mongoose.connection.db;
    const update = { $set: { status: "active" } };
    
    let result = await db.collection("user").findOneAndUpdate({ _id: req.params.id }, update, { returnDocument: "after" });
    
    if (!result && mongoose.Types.ObjectId.isValid(req.params.id)) {
      result = await db.collection("user").findOneAndUpdate({ _id: new mongoose.Types.ObjectId(req.params.id) }, update, { returnDocument: "after" });
    }
    
    if (!result) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: "User unblocked", data: result });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/role
export const updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["admin", "trainer", "user"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role provided" });
    }
    
    const db = mongoose.connection.db;
    const update = { $set: { role } };
    
    let result = await db.collection("user").findOneAndUpdate({ _id: req.params.id }, update, { returnDocument: "after" });
    
    if (!result && mongoose.Types.ObjectId.isValid(req.params.id)) {
      result = await db.collection("user").findOneAndUpdate({ _id: new mongoose.Types.ObjectId(req.params.id) }, update, { returnDocument: "after" });
    }
    
    if (!result) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: `User role updated to ${role}`, data: result });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/trainers
export const getTrainers = async (req, res, next) => {
  try {
    const trainers = await User.find({ role: "trainer" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: trainers });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/trainers/:id/demote
export const demoteTrainer = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: "user" }, { new: true });
    res.status(200).json({ success: true, message: "Trainer demoted to user", data: user });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/classes
export const getClasses = async (req, res, next) => {
  try {
    const rawClasses = await Class.find()
      .populate("trainerId", "name image")
      .sort({ createdAt: -1 });

    const classes = await Promise.all(rawClasses.map(async (cls) => {
      const clsObj = cls.toObject();
      let trainer = clsObj.trainerId;
      if (!trainer || typeof trainer === 'string') {
        let trainerIdStr = typeof trainer === 'string' ? trainer : clsObj.trainerId;
        let user = null;
        if (trainerIdStr) {
          user = await User.findById(trainerIdStr);
          if (!user && mongoose.Types.ObjectId.isValid(trainerIdStr)) {
            user = await User.findOne({ _id: new mongoose.Types.ObjectId(trainerIdStr) });
          }
        }
        if (!user && clsObj.trainerName) {
          user = await User.findOne({ name: clsObj.trainerName });
        }
        if (user) {
          trainer = {
            _id: user._id.toString(),
            name: user.name,
            image: user.image
          };
        }
      }
      clsObj.trainerId = trainer || { name: clsObj.trainerName };
      return clsObj;
    }));

    res.status(200).json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/classes/:id/approve
export const approveClass = async (req, res, next) => {
  try {
    const updated = await Class.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    res.status(200).json({ success: true, message: "Class approved", data: updated });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/classes/:id/reject
export const rejectClass = async (req, res, next) => {
  try {
    const updated = await Class.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
    res.status(200).json({ success: true, message: "Class rejected", data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/classes/:id
export const deleteClass = async (req, res, next) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Class deleted" });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/transactions
export const getTransactions = async (req, res, next) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "name email image")
      .populate("classId", "title className price")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: transactions });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/forum-posts
export const getForumPosts = async (req, res, next) => {
  try {
    const posts = await ForumPost.find()
      .populate("authorId", "name image")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/forum-posts/:id
export const deleteForumPost = async (req, res, next) => {
  try {
    await ForumPost.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/trainer-applications
export const getTrainerApplications = async (req, res, next) => {
  try {
    const apps = await TrainerApplication.find({ status: "pending" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: apps });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/trainer-applications/:id/approve
export const approveTrainerApplication = async (req, res, next) => {
  try {
    const app = await TrainerApplication.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    if (!app) return res.status(404).json({ success: false, message: "Application not found" });

    const db = mongoose.connection.db;
    const update = { 
      $set: { 
        role: "trainer", 
        trainerApplicationStatus: "approved",
        specialty: app.specialty,
        bio: app.bio || "",
        experience: app.experience?.toString() || ""
      } 
    };
    
    let result = await db.collection("user").findOneAndUpdate({ _id: app.userId }, update, { returnDocument: "after" });
    
    if (!result && mongoose.Types.ObjectId.isValid(app.userId)) {
      result = await db.collection("user").findOneAndUpdate({ _id: new mongoose.Types.ObjectId(app.userId) }, update, { returnDocument: "after" });
    }
    
    res.status(200).json({ success: true, message: "Trainer application approved" });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/trainer-applications/:id/reject
export const rejectTrainerApplication = async (req, res, next) => {
  try {
    const { feedback } = req.body;
    const app = await TrainerApplication.findByIdAndUpdate(req.params.id, { status: "rejected", feedback }, { new: true });
    if (!app) return res.status(404).json({ success: false, message: "Application not found" });

    const db = mongoose.connection.db;
    const update = { $set: { trainerApplicationStatus: "rejected", trainerFeedback: feedback } };
    
    let result = await db.collection("user").findOneAndUpdate({ _id: app.userId }, update, { returnDocument: "after" });
    
    if (!result && mongoose.Types.ObjectId.isValid(app.userId)) {
      result = await db.collection("user").findOneAndUpdate({ _id: new mongoose.Types.ObjectId(app.userId) }, update, { returnDocument: "after" });
    }
    
    res.status(200).json({ success: true, message: "Trainer application rejected" });
  } catch (error) {
    next(error);
  }
};
