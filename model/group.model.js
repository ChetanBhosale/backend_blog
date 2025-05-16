const mongoose = require('mongoose')

// Message Schema
const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    attachments: [{
        type: String // URLs to any attached files/images
    }],
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    // Reply related fields
    isReply: {
        type: Boolean,
        default: false
    },
    replyTo: {
        message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'message'
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        content: String // Store a snippet of the original message
    },
    // Thread of replies
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'message'
    }]
}, { timestamps: true });

// Group Schema
const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: ''
    },
    description: String,
    tags: [String],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }],
    messages: [messageSchema],
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// User-Group Relationship Schema
const userGroupSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'group',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
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
    },
    lastReadMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'message'
    }
}, { timestamps: true });

// Create indexes for better query performance
userGroupSchema.index({ group: 1, user: 1 }, { unique: true });
groupSchema.index({ name: 'text', description: 'text' });

// Export the models
exports.Group = mongoose.model('group', groupSchema);
exports.UserGroup = mongoose.model('user_group', userGroupSchema);

exports.messagedBy = {
    user_id : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "user"
    },
    group 
}