const express = require("express");
const { createGroup, getAllGroups, leaveGroup, getUserChats, getSingleConverstationChat, sendMessage, joinGroup, sendFriendRequest, respondToFriendRequest, getPendingFriendRequests, getMostUsedGroupTags, getReleatedGroups, rateUserInGroup, getUserRatingsInGroup, getAllGroupsDetailsForGuest } = require("../controller/groups.controller");
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
router.post('/send-friend-request',authenticateUser,sendFriendRequest)
router.post('/respond-to-friend-request',authenticateUser,respondToFriendRequest)
router.get('/pending-friend-requests', authenticateUser, getPendingFriendRequests)
router.get('/most-used-group-tags', getMostUsedGroupTags)
router.get('/get-related-blogs/:id', getReleatedGroups)
router.post('/rate', authenticateUser,rateUserInGroup);
router.get('/:groupId/ratings/:userId', getUserRatingsInGroup);
router.get('/single-groups/:id', getAllGroupsDetailsForGuest);


module.exports = router;

