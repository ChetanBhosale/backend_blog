const { response } = require("express");
const Blog = require("../model/Blog.model");
const Comment = require("../model/Comments.model");
const { Response } = require("../services/Response");
const mongoose = require("mongoose")

exports.getBlogs = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", tags = "" } = req.query;
    limit = parseInt(limit);
    page = parseInt(page);

    // Create a single search condition object
    const searchConditions = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ],
    };

    // Add tags filter if provided
    if (tags) {
      searchConditions.tags = { $in: tags.split(",") };
    }

    // Get total count
    const totalCount = await Blog.countDocuments(searchConditions);

    const blogs = await Blog.aggregate([
      {
        $match: searchConditions,
      },
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return Response(res, 200, "Blogs fetched successfully", {
      data: blogs,
      currentPage: page,
      totalPages,
      totalCount,
    });
  } catch (error) {
    console.log({ error });
    return Response(res, 500, error.message);
  }
};
exports.getPopulurTags = async (req, res) => {
  try {
    const tags = await Blog.aggregate([
      {
        $unwind: "$tags",
      },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          tag: "$_id",
          count: 1,
          _id: 0,
        },
      },
    ]);
    return Response(res, 200, "Popular tags fetched successfully", tags);
  } catch (error) {
    return Response(res, 500, error.message);
  }
};

exports.getRelatedBlogs = async (req, res) => {
  try {
    const { tags = "", currentBlogId } = req.query;
    const tagArray = tags ? tags.split(",") : [];

    let blogs = await Blog.aggregate([
      {
        $match: {
          ...(tagArray.length > 0 && { tags: { $in: tagArray } }),
          ...(currentBlogId && { _id: { $ne: new mongoose.Types.ObjectId(currentBlogId) } }),
        },
      },
      {
        $limit: 5,
      },
    ]);

    if (blogs.length === 0) {
      blogs = await Blog.aggregate([
        {
          $match: {
            ...(currentBlogId && { _id: { $ne: new mongoose.Types.ObjectId(currentBlogId) } }),
          },
        },
        { $sample: { size: 5 } },
      ]);
    }

    return Response(res, 200, "Related blogs fetched successfully", blogs);
  } catch (error) {
    console.log(error)
    return Response(res, 500, error.message);
  }
};


exports.createComment = async (req, res) => {
  try {
    const { blogId, content } = req.body;
    console.log(req.body)
    const userId = req.user?._id;

    if (!blogId || !content) {
      return Response(res, 400, "Blog ID and comment content are required");
    }

    const comment = await Comment.create({
      blog: blogId,
      user: userId,
      content,
    });

    return Response(res, 201, "Comment added successfully", comment);
  } catch (error) {
    return Response(res, 500, error.message);
  }
};

exports.getCommentsByBlog = async (req, res) => {
  console.log("this is called")
  try {
    const { blogId } = req.params;

    const comments = await Comment.find({ blog: blogId })
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return Response(res, 200, "Comments fetched successfully", comments);
  } catch (error) {
    return Response(res, 500, error.message);
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body; // assuming you are updating the content

    // Validate input
    if (!content) {
      return res.status(400).json({ message: "Content is required." });
    }

    // Validate ObjectId (optional but recommended)
    if (!commentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid comment ID." });
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content },
      { new: true, runValidators: true }
    );

    if (!updatedComment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    return res.status(200).json({
      message: "Comment updated successfully.",
      data: updatedComment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


exports.deleteComments = async (req, res) => {
  try {
    const { commentId } = req.params;

    // Validate MongoDB ObjectId (optional but recommended)
    if (!commentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid comment ID." });
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    return res.status(200).json({
      message: "Comment deleted successfully.",
      data: deletedComment,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
