import { TrainerApplication } from "../models/TrainerApplication.js";
import { User } from "../models/User.js";

// POST /api/trainer-applications
export const applyForTrainer = async (req, res, next) => {
  try {
    const { experience, specialty } = req.body;

    if (!experience || !specialty) {
      return res.status(400).json({ success: false, message: "Experience and specialty are required" });
    }

    const existingApp = await TrainerApplication.findOne({ userId: req.user._id, status: "pending" });
    if (existingApp) {
      return res.status(409).json({ success: false, message: "You already have a pending application" });
    }

    if (req.user.role === "trainer") {
      return res.status(400).json({ success: false, message: "You are already a trainer" });
    }

    const application = await TrainerApplication.create({
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      experience,
      specialty,
      status: "pending"
    });

    await User.findByIdAndUpdate(req.user._id, { trainerApplicationStatus: "pending" });

    res.status(201).json({ success: true, message: "Application submitted successfully", data: application });
  } catch (error) {
    next(error);
  }
};

// GET /api/trainer-applications/my-status
export const getMyApplicationStatus = async (req, res, next) => {
  try {
    // Return latest application
    const application = await TrainerApplication.findOne({ userId: req.user._id }).sort({ createdAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      status: application ? application.status : "none",
      feedback: application ? application.feedback : null,
      data: application 
    });
  } catch (error) {
    next(error);
  }
};
