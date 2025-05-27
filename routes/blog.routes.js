const express = require("express");
const router = express.Router();
const {
  getBlogs,
  getPopulurTags,
  getRelatedBlogs,
  getCommentsByBlog,
  createComment,
  deleteComments,
  updateComment
} = require("../controller/blogs.controller");
const { authorizeRoles, authenticateUser } = require("../middleware/auth.middleware");
const { getFeaturedBlogs } = require("../controller/dashboard.controller");

router.get("/", getBlogs);
router.get("/popular-tags", getPopulurTags);
router.get("/related-blogs", getRelatedBlogs);
router.get("/blog-comments/:blogId", getCommentsByBlog);
router.post("/create-comments", authenticateUser, createComment);
router.put("/update-comment/:commentId", updateComment);
router.delete("/delete-comments/:commentId", authenticateUser, deleteComments);
router.get('/featured-blogs', getFeaturedBlogs  )

module.exports = router;
