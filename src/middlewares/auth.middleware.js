import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const verifyUser = async (req, res, next) => {
  try {
    const cookieName = process.env.COOKIE_NAME || "fitnova_token";
    const token = req.cookies[cookieName] || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "super_secret_jwt_key");
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

export const verifyTrainer = (req, res, next) => {
  if (req.user && req.user.role === "trainer") {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Access restricted to trainers only" });
  }
};

export const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Access restricted to admins only" });
  }
};

export const verifyTrainerOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "trainer" || req.user.role === "admin")) {
    next();
  } else {
    return res.status(403).json({ success: false, message: "Access restricted to trainers or admins" });
  }
};

export const checkBlockedStatus = (req, res, next) => {
  if (req.user && req.user.status === "blocked") {
    // Only block POST, PUT, PATCH, DELETE. Allow GET.
    if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      return res.status(403).json({ success: false, message: "Action restricted by Admin" });
    }
  }
  next();
};
