import express from "express";
import { createCheckoutSession, verifySession, webhook, getMyTransactions } from "../controllers/payment.controller.js";
import { verifyUser, checkBlockedStatus } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Webhook needs raw body, we handled that in server.js. This route itself doesn't need express.json() but it's fine since it was intercepted before.
router.post("/webhook", webhook);

router.post("/create-checkout-session", verifyUser, checkBlockedStatus, createCheckoutSession);
router.get("/session/:sessionId", verifyUser, verifySession);
router.get("/my-transactions", verifyUser, getMyTransactions);

export default router;
