const express = require("express");
const router = express.Router();
const { createBlog, getAdminBlogs, createContentUsingAI, deleteBlog, getBlogById, updateBlog, getAllUser, bannedUser, getGroups, banGroup, getDashboardAnalytics } = require("../controller/dashboard.controller");
const { uploadImage } = require("../middleware/uploadImage.middleware");
const { authorizeRoles, authenticateUser } = require("../middleware/auth.middleware");
const { route } = require("./blog.routes");

router.post("/create-blog",[authenticateUser,authorizeRoles('admin'),uploadImage], createBlog);
router.get("/get-blogs",[authenticateUser,authorizeRoles('admin')], getAdminBlogs);
router.post("/create-content-using-ai",[authenticateUser,authorizeRoles('admin')], createContentUsingAI);
router.delete('/delete-blog', [authenticateUser, authorizeRoles('admin')], deleteBlog)
router.get('/get-blog/:id', getBlogById)
router.put("/update-blog/:id", [authenticateUser, authorizeRoles('admin'), uploadImage], updateBlog);

router.get('/users',[authenticateUser, authorizeRoles('admin')], getAllUser)
router.post('/user-ban', [authenticateUser, authorizeRoles('admin')], bannedUser)

router.get('/dashboard-groups', [authenticateUser, authorizeRoles('admin')], getGroups)
router.post('/dashboard-ban-group', [authenticateUser, authorizeRoles('admin')], banGroup)


// analytics
router.get('/analytics', [authenticateUser, authorizeRoles('admin')], getDashboardAnalytics)


module.exports = router;