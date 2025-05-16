const express = require("express");
const router = express.Router();

const auth = require("./auth.routes");
const dashboard = require("./dashboard.routes");
const blog = require("./blog.routes");
const groups = require('./groups.routes')

router.use("/auth", auth);
router.use("/dashboard", dashboard);
router.use("/blog", blog);
router.use('/group',groups)

module.exports = router;
