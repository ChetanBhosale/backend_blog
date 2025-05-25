const mongoose = require('mongoose')

// Message Schema
const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
        // Removed required: true to allow system messages
    },
    content: {
        type: String,
        required: true
    },
    attachments: [{
        type: String // URLs to any attached files/images
    }],
    role: {
        type: String,
        enum: ['user', 'system'],
        default: 'user'
    }
}, { timestamps: true })


const privateChat = new mongoose.Schema({
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
    },
    messages: [messageSchema],
    lastMessage: {
        type : Object,
    }
}, { timestamps: true });


privateChat.index({ sender: 1, receiver: 1 }, { unique: true });

// Add this new schema for ratings
const ratingSchema = new mongoose.Schema({
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 1,
        default: 1
    }
}, { timestamps: true });

// Add unique compound index to ensure one rating per user pair
ratingSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ''
    },
    description: String,
    tags: [String],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    messages: [messageSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    ratings: [ratingSchema]
}, { timestamps: true })


const joinedGroupSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'group',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true })

joinedGroupSchema.index({ group: 1, user: 1 }, { unique: true })
groupSchema.index({ name: 'text', description: 'text' })

// Export the models
exports.Group = mongoose.model('group', groupSchema)
exports.JoinedGroup = mongoose.model('joinedgroup', joinedGroupSchema)
exports.PrivateChat = mongoose.model('privateChat', privateChat)