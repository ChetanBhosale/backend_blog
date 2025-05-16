const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    }
  },
  { timestamps: true }
);

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
