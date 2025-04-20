const express = require('express');
const router = express.Router();
const {getBlogs, getPopulurTags, getRelatedBlogs} = require('../controller/blogs.controller');

router.get('/', getBlogs)
router.get('/popular-tags', getPopulurTags)
router.get('/related-blogs', getRelatedBlogs)

module.exports = router;