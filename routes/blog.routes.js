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

router.get("/", getBlogs);
router.get("/popular-tags", getPopulurTags);
router.get("/related-blogs", getRelatedBlogs);
router.get("/blog-comments/:blogId", getCommentsByBlog);
router.post("/create-comments", authenticateUser, createComment);
router.put("/update-comment/:commentId", updateComment);
router.delete("/delete-comments/:commentId", authenticateUser, deleteComments);

module.exports = router;
