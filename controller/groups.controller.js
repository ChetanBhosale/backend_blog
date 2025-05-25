const { Group, JoinedGroup, PrivateChat } = require("../model/group.model");
const cors = require('cors');

const createGroup = async (req, res) => {
  try {
    const { name, description, tags } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Group name is required",
      });
    }

    // Create new group
    const newGroup = await Group.create({
      name,
      description,
      tags,
      image: req.body.image || "",
      createdBy: req.user._id,
      admins: [req.user._id],
      members: [req.user._id],
      messages: [
        {
          content: `${req.user.name} created the group`,
          role: "system",
        },
      ],
    });

    // Create joined group relationship
    await JoinedGroup.create({
      group: newGroup._id,
      user: req.user._id,
      role: "admin",
      joinedAt: new Date(),
    });

    // Update group to ensure member is added
    await Group.findByIdAndUpdate(newGroup._id, {
      $addToSet: {
        members: req.user._id,
      },
    });

    // Populate the necessary fields before sending response
    const populatedGroup = await Group.findById(newGroup._id)
      .populate("createdBy", "name email roles")
      .populate("admins", "name email roles")
      .populate("members", "name email roles");

    return res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: populatedGroup,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating group",
      error: error.message,
    });
  }
};

// Add a new function for joining a group
const joinGroup = async (req, res) => {
  try {
    const { group_id } = req.body;
    const userId = req.user._id;

    // Find the group
    const group = await Group.findById(group_id).populate(
      "members",
      "name email roles"
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if user is already a member
    const isMember = group.members.some(
      (member) => member._id.toString() === userId.toString()
    );
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: "You are already a member of this group",
      });
    }

    // Create joined group relationship
    await JoinedGroup.create({
      group: group_id,
      user: userId,
      role: "member",
      joinedAt: new Date(),
    });

    // Add system message that user joined the group
    await Group.findByIdAndUpdate(group_id, {
      $addToSet: {
        members: userId,
      },
      $push: {
        messages: {
          content: `${req.user.name} joined the group`,
          role: "system",
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: "Successfully joined the group",
    });
  } catch (error) {
    console.error("Error joining group:", error);
    return res.status(500).json({
      success: false,
      message: "Error joining group",
      error: error.message,
    });
  }
};
const getAllGroups = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const tags = req.query.tags ? req.query.tags.split(",") : [];
    const userId =
      req.query.userId && req.query.userId !== "undefined"
        ? req.query.userId
        : null;
    const showAll = req.query.showAll ? req.query.showAll === "true" : true; // New control parameter
    const skip = (page - 1) * limit;

    // Base search query
    const searchQuery = {
      isActive: true,
    };

    // Add search conditions if search term exists
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Add tags filter if tags exist and not 'All'
    if (tags.length > 0 && !tags.includes("All")) {
      searchQuery.tags = {
        $regex: new RegExp(tags.join("|"), "i"), // This will match any tag that contains the selected tags
      };
    }

    // User-specific filtering (only applied if userId exists AND showAll is false)
    if (userId && !showAll) {
      searchQuery.$or = [{ createdBy: userId }, { members: userId }];
    }

    // Get total count for pagination
    const totalGroups = await Group.countDocuments(searchQuery);

    // Get groups with pagination and populate necessary fields
    const groups = await Group.find(searchQuery)
      .populate("createdBy", "name email roles")
      .populate("admins", "name email roles")
      .populate("members", "name email roles")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Prepare groups with join status
    let groupsWithJoinStatus = groups.map((group) => ({
      ...group.toObject(),
      isJoined: false, // Default value
      userRole: null,
      joinedAt: null,
      memberCount: group.members.length,
      adminCount: group.admins.length,
    }));

    // Enhance with join status if userId is provided
    if (userId) {
      const userJoinedGroups = await JoinedGroup.find({
        user: userId,
        group: { $in: groups.map((group) => group._id) },
      });

      groupsWithJoinStatus = groupsWithJoinStatus.map((group) => {
        const userJoinedGroup = userJoinedGroups.find(
          (joinedGroup) => joinedGroup.group.toString() === group._id.toString()
        );

        if (userJoinedGroup) {
          return {
            ...group,
            isJoined: true,
            userRole: userJoinedGroup.role,
            joinedAt: userJoinedGroup.joinedAt
              .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
              .replace(/\//g, "/"),
          };
        }
        return group;
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        groups: groupsWithJoinStatus,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalGroups / limit),
          totalGroups,
          hasNextPage: page * limit < totalGroups,
          hasPreviousPage: page > 1,
        },
        filters: {
          search,
          tags,
          userId: userId || null,
          showAll, // Include showAll in response for transparency
        },
      },
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching groups",
      error: error.message,
    });
  }
};

const leaveGroup = async (req, res) => {
  try {
    const { group_id } = req.body;
    const userId = req.user._id;

    // Find the group and check if user is a member
    const group = await Group.findById(group_id).populate(
      "members",
      "name email roles"
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if user is a member of the group
    const userMember = group.members.find(
      (member) => member._id.toString() === userId.toString()
    );
    if (!userMember) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this group",
      });
    }

    // Check if user is an admin
    const isAdmin = group.admins.includes(userId);
    const isLastAdmin = isAdmin && group.admins.length === 1;
    const isLastMember = group.members.length === 1;

    // If this is the last member, delete the group
    if (isLastMember) {
      await Group.findByIdAndDelete(group_id);
      await JoinedGroup.deleteMany({ group: group_id });

      return res.status(200).json({
        success: true,
        message: "Group deleted as you were the last member",
      });
    }

    // Add system message that user left the group
    await Group.findByIdAndUpdate(group_id, {
      $push: {
        messages: {
          content: `${userMember.name} left the group`,
          role: "system",
        },
      },
    });

    // If user is the last admin, make another member an admin
    if (isLastAdmin) {
      // Find another member who is not the current user
      const newAdmin = group.members.find(
        (member) =>
          member._id.toString() !== userId.toString() &&
          !group.admins.includes(member._id)
      );

      if (newAdmin) {
        // Update the group with new admin
        await Group.findByIdAndUpdate(group_id, {
          $pull: {
            admins: userId,
            members: userId,
          },
          $addToSet: { admins: newAdmin._id },
        });

        // Update JoinedGroup for new admin
        await JoinedGroup.findOneAndUpdate(
          { group: group_id, user: newAdmin._id },
          { role: "admin" }
        );

        // Add system message about new admin
        await Group.findByIdAndUpdate(group_id, {
          $push: {
            messages: {
              content: `${newAdmin.name} is now an admin`,
              role: "system",
            },
          },
        });
      }
    } else {
      // If not last admin, just remove user from group
      await Group.findByIdAndUpdate(group_id, {
        $pull: {
          admins: userId,
          members: userId,
        },
      });
    }

    // Remove the joined group relationship
    await JoinedGroup.findOneAndDelete({
      group: group_id,
      user: userId,
    });

    return res.status(200).json({
      success: true,
      message: "Successfully left the group",
    });
  } catch (error) {
    console.error("Error leaving group:", error);
    return res.status(500).json({
      success: false,
      message: "Error leaving group",
      error: error.message,
    });
  }
};

const getUserChats = async (req, res) => {
  try {
    const { current = "all" } = req.query;
    const userId = req.user._id;

    let result = {
      groups: [],
      privateChats: [],
      pendingRequests: [],
    };

    // Get group chats if current is 'group' or 'all'
    if (current === "group" || current === "all") {
      const joinedGroups = await JoinedGroup.find({ user: userId }).populate({
        path: "group",
        populate: [
          { path: "createdBy", select: "name email roles" },
          { path: "admins", select: "name email roles" },
          { path: "members", select: "name email roles" },
        ],
      });

      result.groups = joinedGroups
        .filter(joinedGroup => joinedGroup.group) // Filter out any null groups
        .map((joinedGroup) => {
          const group = joinedGroup.group;
          const lastMessage =
            group.messages && group.messages.length > 0
              ? group.messages[group.messages.length - 1]
              : null;

          return {
            ...group.toObject(),
            userRole: joinedGroup.role,
            joinedAt: joinedGroup.joinedAt
              .toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
              .replace(/\//g, "/"),
            memberCount: group.members ? group.members.length : 0,
            adminCount: group.admins ? group.admins.length : 0,
            lastMessage: lastMessage
              ? {
                  content: lastMessage.content,
                  sender: lastMessage.sender,
                  attachments: lastMessage.attachments,
                  createdAt: lastMessage.createdAt,
                  updatedAt: lastMessage.updatedAt,
                  role: lastMessage.role,
                }
              : null,
          };
        });
    }

    // Get private chats if current is 'private' or 'all'
    if (current === "private" || current === "all") {
      const privateChats = await PrivateChat.find({
        $or: [{ sender: userId }, { receiver: userId }],
      })
        .populate("sender", "name email roles")
        .populate("receiver", "name email roles")
        .populate("lastMessage");

      // Separate pending requests and active chats
      result.privateChats = privateChats
        .filter((chat) => chat.status === "accepted" && chat.sender && chat.receiver)
        .map((chat) => {
          const otherUser =
            chat.sender._id.toString() === userId.toString()
              ? chat.receiver
              : chat.sender;

          return {
            chatId: chat._id,
            otherUser: {
              _id: otherUser._id,
              name: otherUser.name,
              email: otherUser.email,
              roles: otherUser.roles,
            },
            status: chat.status,
            lastMessage: chat.lastMessage,
            unreadCount: 0,
            updatedAt: chat.updatedAt,
          };
        });

      // Add pending requests
      result.pendingRequests = privateChats
        .filter((chat) => chat.status === "pending" && chat.sender && chat.receiver)
        .map((chat) => {
          const isSender = chat.sender._id.toString() === userId.toString();
          const otherUser = isSender ? chat.receiver : chat.sender;

          return {
            chatId: chat._id,
            otherUser: {
              _id: otherUser._id,
              name: otherUser.name,
              email: otherUser.email,
              roles: otherUser.roles,
            },
            isSender,
            status: chat.status,
            createdAt: chat.createdAt,
          };
        });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching user chats:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user chats",
      error: error.message,
    });
  }
};

const getSingleConverstationChat = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // First check if it's a group chat
    const group = await Group.findById(id)
      .populate("createdBy", "name email roles")
      .populate("admins", "name email roles")
      .populate("members", "name email roles")
      .populate({
        path: "messages",
        populate: {
          path: "sender",
          select: "name email roles",
        },
      });

    if (group) {
      // Check if user is a member of the group
      const isMember = group.members.some(
        (member) => member._id.toString() === userId.toString()
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }

      // Get user's role in the group
      const joinedGroup = await JoinedGroup.findOne({
        group: id,
        user: userId,
      });

      return res.status(200).json({
        success: true,
        data: {
          group_chat: true,
          chat_details: {
            _id: group._id,
            name: group.name,
            image: group.image,
            description: group.description,
            createdBy: group.createdBy,
            admins: group.admins,
            members: group.members,
            userRole: joinedGroup.role,
            messages: group.messages.map((message) => ({
              _id: message._id,
              content: message.content,
              sender: message.sender,
              attachments: message.attachments,
              role: message.role,
              createdAt: message.createdAt,
              updatedAt: message.updatedAt
            })),
          },
        },
      });
    }

    // If not a group, check if it's a private chat
    const privateChat = await PrivateChat.findOne({
      _id: id,
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
      .populate("sender", "name email roles")
      .populate("receiver", "name email roles")
      .populate({
        path: "messages",
        populate: {
          path: "sender",
          select: "name email roles",
        },
      });

    if (privateChat) {
      const otherUser =
        privateChat.sender._id.toString() === userId.toString()
          ? privateChat.receiver
          : privateChat.sender;

      return res.status(200).json({
        success: true,
        data: {
          group_chat: false,
          chat_details: {
            _id: privateChat._id,
            otherUser: {
              _id: otherUser._id,
              name: otherUser.name,
              email: otherUser.email,
              roles: otherUser.roles,
            },
            isAccepted: privateChat.isAccepted,
            messages: privateChat.messages.map((message) => ({
              _id: message._id,
              content: message.content,
              sender: message.sender,
              attachments: message.attachments,
              role: message.role,
              createdAt: message.createdAt,
              updatedAt: message.updatedAt
            })),
          },
        },
      });
    }

    // If neither group nor private chat found
    return res.status(404).json({
      success: false,
      message: "Chat not found",
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching conversation",
      error: error.message,
    });
  }
};
const sendMessage = async (req, res) => {
  try {
    const { id, content, attachments = [] } = req.body;
    const userId = req.user._id;
    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Check if it's a group chat
    const group = await Group.findById(id);
    if (group) {
      // Existing group chat logic remains unchanged
      // ...
    } else {
      // Handle private chat
      let privateChat = await PrivateChat.findOne({
        $or: [
          { sender: userId, receiver: id },
          { sender: id, receiver: userId },
        ],
      });

      if (!privateChat) {
        return res.status(404).json({
          success: false,
          message: "No chat exists with this user. Send a friend request first.",
        });
      }

      if (privateChat.status !== "accepted") {
        return res.status(403).json({
          success: false,
          message: "Cannot send message until friend request is accepted",
        });
      }

      const newMessage = {
        sender: userId,
        content,
        attachments,
        role: "user",
      };

      await PrivateChat.findByIdAndUpdate(privateChat._id, {
        $push: { messages: newMessage },
        $set: { lastMessage: newMessage },
      });

      const updatedChat = await PrivateChat.findById(privateChat._id)
        .populate("sender", "name email roles")
        .populate("receiver", "name email roles")
        .populate({
          path: "messages",
          populate: {
            path: "sender",
            select: "name email roles",
          },
        });

      const lastMessage = updatedChat.messages[updatedChat.messages.length - 1];
      const otherUser =
        updatedChat.sender._id.toString() === userId.toString()
          ? updatedChat.receiver
          : updatedChat.sender;

      return res.status(200).json({
        success: true,
        message: "Message sent successfully",
        data: {
          group_chat: false,
          chat_details: {
            _id: updatedChat._id,
            otherUser: {
              _id: otherUser._id,
              name: otherUser.name,
              email: otherUser.email,
              roles: otherUser.roles,
            },
            isAccepted: updatedChat.status === "accepted",
            message: {
              _id: lastMessage._id,
              content: lastMessage.content,
              sender: lastMessage.sender,
              attachments: lastMessage.attachments,
              role: lastMessage.role,
              createdAt: lastMessage.createdAt,
              updatedAt: lastMessage.updatedAt,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
};

const sendFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    // Check if a chat already exists between these users
    const existingChat = await PrivateChat.findOne({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId },
      ],
    });

    if (existingChat) {
      return res.status(400).json({
        success: false,
        message: "Chat already exists between these users",
      });
    }

    // Create new private chat with pending status
    const newChat = await PrivateChat.create({
      sender: userId,
      receiver: receiverId,
      status: "pending",
      messages: [
        {
          content: `${req.user.name} sent you a friend request`,
          role: "system",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Friend request sent successfully",
      data: newChat,
    });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return res.status(500).json({
      success: false,
      message: "Error sending friend request",
      error: error.message,
    });
  }
};

const respondToFriendRequest = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatId, action } = req.body;

    if (!chatId || !action) {
      return res.status(400).json({
        success: false,
        message: "Chat ID and action are required",
      });
    }

    if (!["accepted", "rejected"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'accepted' or 'rejected'",
      });
    }

    // Find the chat and verify the receiver
    const chat = await PrivateChat.findOne({
      _id: chatId,
      receiver: userId,
      status: "pending",
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Friend request not found or already processed",
      });
    }

    // Update chat status
    chat.status = action;

    // Add system message about the response
    chat.messages.push({
      content:
        action === "accepted"
          ? `${req.user.name} accepted your friend request`
          : `${req.user.name} rejected your friend request`,
      role: "system",
    });

    await chat.save();

    return res.status(200).json({
      success: true,
      message: `Friend request ${action} successfully`,
      data: chat,
    });
  } catch (error) {
    console.error("Error responding to friend request:", error);
    return res.status(500).json({
      success: false,
      message: "Error responding to friend request",
      error: error.message,
    });
  }
};

const getPendingFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find all pending friend requests where the current user is the receiver
    const pendingRequests = await PrivateChat.find({
      receiver: userId,
      status: "pending",
    })
      .populate("sender", "name email roles")
      .populate("receiver", "name email roles")
      .sort({ createdAt: -1 }); // Sort by newest first

    // Format the response
    const formattedRequests = pendingRequests.map((request) => ({
      requestId: request._id,
      sender: {
        _id: request.sender._id,
        name: request.sender.name,
        email: request.sender.email,
        roles: request.sender.roles,
      },
      status: request.status,
      createdAt: request.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalRequests: pendingRequests.length,
        requests: formattedRequests,
      },
    });
  } catch (error) {
    console.error("Error fetching pending friend requests:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching pending friend requests",
      error: error.message,
    });
  }
};

const getMostUsedGroupTags = async (req, res) => {
  try {
    // Aggregate to count tag occurrences
    const tagCounts = await Group.aggregate([
      { $unwind: "$tags" }, // Split array of tags into separate documents
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } }, // Sort by count in descending order
    ]);

    // Format the response
    const formattedTags = tagCounts.map((tag) => ({
      tag: tag._id,
      count: tag.count,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalTags: formattedTags.length,
        tags: formattedTags,
      },
    });
  } catch (error) {
    console.error("Error fetching group tags:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching group tags",
      error: error.message,
    });
  }
};


module.exports = {
  createGroup,
  getAllGroups,
  leaveGroup,
  getUserChats,
  joinGroup,
  getSingleConverstationChat,
  sendMessage,
  sendFriendRequest,
  respondToFriendRequest,
  getPendingFriendRequests,
  getMostUsedGroupTags,
};
