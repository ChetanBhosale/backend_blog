const express = require("express");
const router = express.Router();
const {
  getBlogs,
  getPopulurTags,
  getRelatedBlogs,
  getCommentsByBlog,
  createComment,
} = require("../controller/blogs.controller");
const { authorizeRoles, authenticateUser } = require("../middleware/auth.middleware");

router.get("/", getBlogs);
router.get("/popular-tags", getPopulurTags);
router.get("/related-blogs", getRelatedBlogs);
router.get("/blog-comments", getCommentsByBlog);
router.post("/create-comments", authenticateUser, createComment);

module.exports = router;
