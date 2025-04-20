const express = require("express");
const router = express.Router();
const { createBlog, getAdminBlogs, createContentUsingAI } = require("../controller/dashboard.controller");
const { uploadImage } = require("../middleware/uploadImage.middleware");
const { authorizeRoles, authenticateUser } = require("../middleware/auth.middleware");

router.post("/create-blog",[authenticateUser,authorizeRoles('admin'),uploadImage], createBlog);
router.get("/get-blogs",[authenticateUser,authorizeRoles('admin')], getAdminBlogs);
router.post("/create-content-using-ai",[authenticateUser,authorizeRoles('admin')], createContentUsingAI);


module.exports = router;