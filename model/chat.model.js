const mongoose = require('mongoose');
const User = require('./User.model');

// Private Message Schema
const privateMessageSchema = new mongoose.Schema({
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
    content: {
        type: String,
        required: true
    },
    attachments: [{
        type: String // URLs to any attached files/images
    }],
    readBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Reply related fields
    isReply: {
        type: Boolean,
        default: false
    },
    replyTo: {
        message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'privateMessage'
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String
    }
}, { timestamps: true });

// Create indexes
privateMessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

exports.PrivateMessage = mongoose.model('privateMessage', privateMessageSchema); 