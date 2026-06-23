import express from "express";
import { register, login, logout, getMe, getSession, signUpEmail, signInEmail } from "../controllers/auth.controller.js";
import { verifyUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Standard REST Auth
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", verifyUser, getMe);
router.get("/session", verifyUser, getSession);

// Better Auth Client specific endpoints
router.post("/sign-up/email", signUpEmail);
router.post("/sign-in/email", signInEmail);
router.post("/sign-out", logout);
router.get("/get-session", verifyUser, getSession);

export default router;
