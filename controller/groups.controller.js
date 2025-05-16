const { Group, UserGroup } = require('../model/group.model');

const createGroup = async(req, res) => {
    try {
        const { name, description, tags } = req.body;
        
        // Validate required fields
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Group name is required"
            });
        }

        // Create new group
        const newGroup = await Group.create({
            name,
            description,
            tags,
            image: req.body.image || '',
            createdBy: req.user._id,
            admins: [req.user._id], // Add creator as admin
            members: [req.user._id] // Add creator as member
        });

        // Create user-group relationship
        await UserGroup.create({
            group: newGroup._id,
            user: req.user._id,
            role: 'admin',
            joinedAt: new Date()
        });

        // Populate the necessary fields before sending response
        const populatedGroup = await Group.findById(newGroup._id)
            .populate('createdBy', 'name email')
            .populate('admins', 'name email')
            .populate('members', 'name email');

        return res.status(201).json({
            success: true,
            message: "Group created successfully",
            data: populatedGroup
        });

    } catch (error) {
        console.error('Error creating group:', error);
        return res.status(500).json({
            success: false,
            message: "Error creating group",
            error: error.message
        });
    }
}

const getGroups = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = {
            isActive: true,
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ]
        };

        // Get total count for pagination
        const totalGroups = await Group.countDocuments(searchQuery);

        // Get groups with pagination and populate necessary fields
        const groups = await Group.find(searchQuery)
            .populate('createdBy', 'name email')
            .populate('admins', 'name email')
            .populate('members', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get user's role in each group
        const userGroups = await UserGroup.find({
            user: req.user._id,
            group: { $in: groups.map(group => group._id) }
        });

        // Map user roles to groups
        const groupsWithUserRole = groups.map(group => {
            const userGroup = userGroups.find(ug => ug.group.toString() === group._id.toString());
            return {
                ...group.toObject(),
                userRole: userGroup ? userGroup.role : null
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                groups: groupsWithUserRole,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalGroups / limit),
                    totalGroups,
                    hasNextPage: page * limit < totalGroups,
                    hasPreviousPage: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching groups:', error);
        return res.status(500).json({
            success: false,
            message: "Error fetching groups",
            error: error.message
        });
    }
}

// Get user's groups (groups where user is a member)
const getUserGroups = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const role = req.query.role; // Optional filter for role (admin/member)

        // Build query based on role filter
        let query = { user: req.user._id };
        if (role) {
            query.role = role;
        }

        // Find user's group memberships
        const userGroups = await UserGroup.find(query)
            .populate({
                path: 'group',
                match: { isActive: true }, // Only get active groups
                populate: [
                    { path: 'createdBy', select: 'name email' },
                    { path: 'admins', select: 'name email' },
                    { path: 'members', select: 'name email' }
                ]
            })
            .sort({ joinedAt: -1 })
            .skip(skip)
            .limit(limit);

      
        const validUserGroups = userGroups.filter(ug => ug.group);

        // Get total count with the same query
        const totalGroups = await UserGroup.countDocuments(query);

        // Get admin groups separately for additional context
        const adminGroups = await Group.find({
            _id: { $in: validUserGroups.map(ug => ug.group._id) },
            admins: req.user._id
        });

        return res.status(200).json({
            success: true,
            data: {
                groups: validUserGroups.map(ug => ({
                    ...ug.group.toObject(),
                    userRole: ug.role,
                    joinedAt: ug.joinedAt,
                    isAdmin: adminGroups.some(ag => ag._id.toString() === ug.group._id.toString())
                })),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalGroups / limit),
                    totalGroups,
                    hasNextPage: page * limit < totalGroups,
                    hasPreviousPage: page > 1
                },
                summary: {
                    totalGroups: totalGroups,
                    adminGroups: adminGroups.length,
                    memberGroups: totalGroups - adminGroups.length
                }
            }
        });

    } catch (error) {
        console.error('Error fetching user groups:', error);
        return res.status(500).json({
            success: false,
            message: "Error fetching user groups",
            error: error.message
        });
    }
}

module.exports = {
    createGroup,
    getGroups,
    getUserGroups
}