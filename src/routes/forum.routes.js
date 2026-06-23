import express from "express";
import { 
  getPosts, getLatestPosts, getPostById, createPost, updatePost, deletePost, 
  toggleLike, toggleDislike, getComments, addComment, editComment, deleteComment 
} from "../controllers/forum.controller.js";
import { verifyUser, verifyTrainerOrAdmin, checkBlockedStatus } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Posts
router.get("/posts", getPosts);
router.get("/posts/latest", getLatestPosts);
router.get("/posts/:id", getPostById);
router.post("/posts", verifyUser, verifyTrainerOrAdmin, checkBlockedStatus, createPost);
router.patch("/posts/:id", verifyUser, checkBlockedStatus, updatePost); // handled ownership in controller
router.delete("/posts/:id", verifyUser, checkBlockedStatus, deletePost);

// Votes
router.post("/posts/:id/like", verifyUser, checkBlockedStatus, toggleLike);
router.post("/posts/:id/dislike", verifyUser, checkBlockedStatus, toggleDislike);

// Comments
router.get("/posts/:postId/comments", verifyUser, getComments);
router.post("/posts/:postId/comments", verifyUser, checkBlockedStatus, addComment);
router.patch("/comments/:commentId", verifyUser, checkBlockedStatus, editComment);
router.delete("/comments/:commentId", verifyUser, checkBlockedStatus, deleteComment);

export default router;
