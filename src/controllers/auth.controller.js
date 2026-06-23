import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";

const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET || "super_secret_jwt_key", {
    expiresIn: "7d",
  });

  const cookieName = process.env.COOKIE_NAME || "fitnova_token";
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

// Standard Registration
export const register = async (req, res, next) => {
  try {
    const { name, email, password, image } = req.body;
    
    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (password.length < 6 || !/(?=.*[a-z])(?=.*[A-Z])/.test(password)) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters and contain uppercase and lowercase letters" 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    // BetterAuth/Bcrypt usually handles this, we do it manually to ensure Mongoose model compatibility
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      image: image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`,
      role: "user",
      status: "active"
    });

    const token = generateTokenAndSetCookie(user._id, res);

    // Also set a generic session object for BetterAuth compatibility if called from that route
    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, image: user.image },
      token
    });
  } catch (error) {
    next(error);
  }
};

// Better Auth Compatible Sign Up
export const signUpEmail = async (req, res, next) => {
  req.body.name = req.body.name || req.body.email.split('@')[0];
  await register(req, res, next);
};

// Standard Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Missing email or password" });
    }

    const user = await User.findOne({ email }).select("+password"); // Need to explicitly select if it was select: false
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Assuming we added password to the schema, oh wait, I didn't add password to User schema! 
    // I need to add password to the User schema. Let's use generic compare if password exists.
    // I will modify the User model to include password.
    if (!user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials (No password set)" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateTokenAndSetCookie(user._id, res);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: { id: user._id, name: user.name, email: user.email, role: user.role, image: user.image, status: user.status },
      token
    });
  } catch (error) {
    next(error);
  }
};

// Better Auth Compatible Sign In
export const signInEmail = async (req, res, next) => {
  await login(req, res, next);
};

// Standard Logout
export const logout = async (req, res, next) => {
  try {
    const cookieName = process.env.COOKIE_NAME || "fitnova_token";
    res.cookie(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      expires: new Date(0)
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// Get Session for Better Auth compatibility
export const getSession = async (req, res, next) => {
  try {
    // If the middleware passed, we have req.user
    if (!req.user) {
      return res.status(401).json({ success: false, message: "No active session" });
    }

    // Better Auth format
    res.status(200).json({
      session: {
        id: "session_" + req.user._id,
        userId: req.user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        image: req.user.image,
        role: req.user.role,
        status: req.user.status,
        trainerApplicationStatus: req.user.trainerApplicationStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// Standard Get Me
export const getMe = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};
