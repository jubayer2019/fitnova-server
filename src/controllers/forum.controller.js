import { ForumPost } from "../models/ForumPost.js";
import { Comment } from "../models/Comment.js";

// GET /api/forum/posts
export const getPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const posts = await ForumPost.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ForumPost.countDocuments();

    res.status(200).json({
      success: true,
      data: posts,
      total,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/forum/posts/latest
export const getLatestPosts = async (req, res, next) => {
  try {
    const posts = await ForumPost.find().sort({ createdAt: -1 }).limit(4);
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// GET /api/forum/posts/:id
export const getPostById = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

// POST /api/forum/posts
export const createPost = async (req, res, next) => {
  try {
    const { title, image, description } = req.body;
    
    const post = await ForumPost.create({
      title,
      image,
      description,
      excerpt: description.substring(0, 100) + "...",
      authorId: req.user._id,
      authorName: req.user.name,
      authorEmail: req.user.email,
      authorRole: req.user.role,
    });

    res.status(201).json({ success: true, message: "Post created", data: post });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/forum/posts/:id
export const updatePost = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (req.user.role !== "admin" && post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const updated = await ForumPost.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: "Post updated", data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/forum/posts/:id
export const deletePost = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    if (req.user.role !== "admin" && post.authorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await post.deleteOne();
    await Comment.deleteMany({ postId: req.params.id }); // Clean up comments

    res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    next(error);
  }
};

// POST /api/forum/posts/:id/like
export const toggleLike = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const userId = req.user._id;

    // If previously disliked, remove dislike
    if (post.dislikedBy.includes(userId)) {
      post.dislikedBy.pull(userId);
      post.dislikes -= 1;
    }

    // Toggle like
    if (post.likedBy.includes(userId)) {
      post.likedBy.pull(userId);
      post.likes -= 1;
    } else {
      post.likedBy.push(userId);
      post.likes += 1;
    }

    await post.save();
    res.status(200).json({ success: true, likes: post.likes, dislikes: post.dislikes });
  } catch (error) {
    next(error);
  }
};

// POST /api/forum/posts/:id/dislike
export const toggleDislike = async (req, res, next) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const userId = req.user._id;

    // If previously liked, remove like
    if (post.likedBy.includes(userId)) {
      post.likedBy.pull(userId);
      post.likes -= 1;
    }

    // Toggle dislike
    if (post.dislikedBy.includes(userId)) {
      post.dislikedBy.pull(userId);
      post.dislikes -= 1;
    } else {
      post.dislikedBy.push(userId);
      post.dislikes += 1;
    }

    await post.save();
    res.status(200).json({ success: true, likes: post.likes, dislikes: post.dislikes });
  } catch (error) {
    next(error);
  }
};

// GET /api/forum/posts/:postId/comments
export const getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ postId: req.params.postId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
};

// POST /api/forum/posts/:postId/comments
export const addComment = async (req, res, next) => {
  try {
    const { body, parentCommentId } = req.body;
    
    if (!body) return res.status(400).json({ success: false, message: "Comment body is required" });

    const comment = await Comment.create({
      postId: req.params.postId,
      userId: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      userImage: req.user.image,
      body,
      parentCommentId: parentCommentId || null
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/forum/comments/:commentId
export const editComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    comment.body = req.body.body;
    await comment.save();

    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/forum/comments/:commentId
export const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    if (req.user.role !== "admin" && comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    await comment.deleteOne();
    // Optional: Also delete replies? For simplicity, we just delete the comment.
    
    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};
