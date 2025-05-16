const mongoose = require('mongoose');
const User = require('./User.model');

// Friend Request Schema
const friendRequestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

// Friend Schema (for accepted friendships)
const friendSchema = new mongoose.Schema({
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['active', 'blocked'],
        default: 'active'
    }
}, { timestamps: true });

// Create indexes
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
friendSchema.index({ users: 1 });

exports.FriendRequest = mongoose.model('friendRequest', friendRequestSchema);
exports.Friend = mongoose.model('friend', friendSchema); 