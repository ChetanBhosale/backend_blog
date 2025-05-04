const express = require("express");
const router = express.Router();
const { createBlog, getAdminBlogs, createContentUsingAI, deleteBlog, getBlogById, updateBlog } = require("../controller/dashboard.controller");
const { uploadImage } = require("../middleware/uploadImage.middleware");
const { authorizeRoles, authenticateUser } = require("../middleware/auth.middleware");
const { route } = require("./blog.routes");

router.post("/create-blog",[authenticateUser,authorizeRoles('admin'),uploadImage], createBlog);
router.get("/get-blogs",[authenticateUser,authorizeRoles('admin')], getAdminBlogs);
router.post("/create-content-using-ai",[authenticateUser,authorizeRoles('admin')], createContentUsingAI);
router.delete('/delete-blog', [authenticateUser, authorizeRoles('admin')], deleteBlog)
router.get('/get-blog/:id', getBlogById)
router.put("/update-blog/:id", [authenticateUser, authorizeRoles('admin'), uploadImage], updateBlog);

module.exports = router;