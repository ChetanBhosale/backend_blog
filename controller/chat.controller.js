const { PrivateMessage } = require('../model/chat.model');
const { Friend } = require('../model/friend.model');

// Send private message
const sendPrivateMessage = async (req, res) => {
    try {
        const { receiverId, content, attachments = [] } = req.body;

        // Check if users are friends
        const friendship = await Friend.findOne({
            users: { $all: [req.user._id, receiverId] },
            status: 'active'
        });

        if (!friendship) {
            return res.status(403).json({
                success: false,
                message: "Cannot send message to non-friend user"
            });
        }

        const message = await PrivateMessage.create({
            sender: req.user._id,
            receiver: receiverId,
            content,
            attachments,
            readBy: [req.user._id]
        });

        return res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: message
        });

    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({
            success: false,
            message: "Error sending message",
            error: error.message
        });
    }
};

// Get chat history with a user
const getChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const messages = await PrivateMessage.find({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        })
        .populate('sender', 'name email')
        .populate('receiver', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

        // Mark messages as read
        await PrivateMessage.updateMany(
            {
                sender: userId,
                receiver: req.user._id,
                readBy: { $ne: req.user._id }
            },
            {
                $addToSet: { readBy: req.user._id }
            }
        );

        const total = await PrivateMessage.countDocuments({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        });

        return res.status(200).json({
            success: true,
            data: {
                messages: messages.reverse(),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalMessages: total,
                    hasNextPage: page * limit < total,
                    hasPreviousPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        return res.status(500).json({
            success: false,
            message: "Error fetching chat history",
            error: error.message
        });
    }
};

module.exports = {
    sendPrivateMessage,
    getChatHistory
}; 