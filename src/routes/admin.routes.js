import express from "express";
import { 
  getOverview, getUsers, blockUser, unblockUser, makeAdmin,
  getTrainers, demoteTrainer,
  getClasses, approveClass, rejectClass, deleteClass,
  getTransactions, getForumPosts, deleteForumPost,
  getTrainerApplications, approveTrainerApplication, rejectTrainerApplication
} from "../controllers/admin.controller.js";
import { verifyUser, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyUser, verifyAdmin);

router.get("/overview", getOverview);

router.get("/users", getUsers);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);
router.patch("/users/:id/make-admin", makeAdmin);

router.get("/trainers", getTrainers);
router.patch("/trainers/:id/demote", demoteTrainer);

router.get("/classes", getClasses);
router.patch("/classes/:id/approve", approveClass);
router.patch("/classes/:id/reject", rejectClass);
router.delete("/classes/:id", deleteClass);

router.get("/transactions", getTransactions);

router.get("/forum-posts", getForumPosts);
router.delete("/forum-posts/:id", deleteForumPost);

router.get("/trainer-applications", getTrainerApplications);
router.patch("/trainer-applications/:id/approve", approveTrainerApplication);
router.patch("/trainer-applications/:id/reject", rejectTrainerApplication);

export default router;
