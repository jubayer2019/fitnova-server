import express from "express";
import { addFavorite, getMyFavorites, checkFavorite, removeFavorite } from "../controllers/favorite.controller.js";
import { verifyUser, checkBlockedStatus } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", verifyUser, checkBlockedStatus, addFavorite);
router.get("/my-favorites", verifyUser, getMyFavorites);
router.get("/check/:classId", verifyUser, checkFavorite);
router.delete("/:classId", verifyUser, checkBlockedStatus, removeFavorite);

export default router;
