const express = require("express");
const { createGroup, getAllGroups, leaveGroup, getUserChats, getSingleConverstationChat, sendMessage, joinGroup } = require("../controller/groups.controller");
const { authenticateUser } = require("../middleware/auth.middleware");
const { uploadImage } = require("../middleware/uploadImage.middleware");
const router = express.Router();

router.post('/create',authenticateUser, uploadImage, createGroup)
router.get('/all', getAllGroups)
router.post('/leave',authenticateUser,leaveGroup)
router.post('/join',authenticateUser,joinGroup)
router.get('/chats', authenticateUser, getUserChats)
router.get('/single-chat/:id',authenticateUser,getSingleConverstationChat)
router.post('/send-message',authenticateUser,uploadImage,sendMessage)

module.exports = router;