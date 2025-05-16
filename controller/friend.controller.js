const { FriendRequest, Friend } = require('../model/friend.model');
const { User } = require('../model/User.model');

// Send friend request
const sendFriendRequest = async (req, res) => {
    try {
        const { receiverId } = req.body;

        // Check if request already exists
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: req.user._id, receiver: receiverId },
                { sender: receiverId, receiver: req.user._id }
            ]
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "Friend request already exists"
            });
        }

        // Create new friend request
        const friendRequest = await FriendRequest.create({
            sender: req.user._id,
            receiver: receiverId
        });

        return res.status(201).json({
            success: true,
            message: "Friend request sent successfully",
            data: friendRequest
        });

    } catch (error) {
        console.error('Error sending friend request:', error);
        return res.status(500).json({
            success: false,
            message: "Error sending friend request",
            error: error.message
        });
    }
};

// Accept friend request
const acceptFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            return res.status(404).json({
                success: false,
                message: "Friend request not found"
            });
        }

        if (friendRequest.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Not authorized to accept this request"
            });
        }

        // Update request status
        friendRequest.status = 'accepted';
        await friendRequest.save();

        // Create friendship
        await Friend.create({
            users: [friendRequest.sender, friendRequest.receiver]
        });

        return res.status(200).json({
            success: true,
            message: "Friend request accepted"
        });

    } catch (error) {
        console.error('Error accepting friend request:', error);
        return res.status(500).json({
            success: false,
            message: "Error accepting friend request",
            error: error.message
        });
    }
};

// Get friend requests
const getFriendRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const requests = await FriendRequest.find({
            receiver: req.user._id,
            status: 'pending'
        })
        .populate('sender', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        const total = await FriendRequest.countDocuments({
            receiver: req.user._id,
            status: 'pending'
        });

        return res.status(200).json({
            success: true,
            data: {
                requests,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalRequests: total,
                    hasNextPage: page * limit < total,
                    hasPreviousPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching friend requests:', error);
        return res.status(500).json({
            success: false,
            message: "Error fetching friend requests",
            error: error.message
        });
    }
};

module.exports = {
    sendFriendRequest,
    acceptFriendRequest,
    getFriendRequests
}; 