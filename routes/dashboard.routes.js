const express = require("express");
const router = express.Router();
const { createBlog } = require("../controller/dashboard.controller");

router.post("/create-blog", createBlog);

module.exports = router;