const express = require("express");
const router = express.Router();

const auth = require("./auth.routes");
const dashboard = require("./dashboard.routes");
const blog = require("./blog.routes");

router.use("/auth", auth);
router.use("/dashboard", dashboard);
router.use("/blog", blog);

module.exports = router;
