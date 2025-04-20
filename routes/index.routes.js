const express = require('express')
const router = express.Router()

const auth = require("./auth.routes")
const dashboard = require("./dashboard.routes")

router.use('/auth', auth)
router.use('/dashboard', dashboard)

module.exports = router