const User = require('../model/User.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Response } = require('../services/Response');

// Register new user
exports.register = async (req, res) => {
    try {
        let { name, email, password, role } = req.body;
        console.log(req.body)

        if(!name || !email || !password || !role){
            return Response(res, 400, 'All fields are required');
        }

        email = email.toLowerCase().trim();
        name = name.trim();
        password = password.trim();
        role = role.trim();

        // Check if role is valid and not admin
        if (!role || !['student', 'collage_student', 'counsellor'].includes(role)) {
            return Response(res, 400, 'Invalid role selected');
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return Response(res, 400, 'User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role
        });

        await user.save();

        // Remove password from token data
        const userForToken = user.toObject();
        delete userForToken.password;

        // Create JWT token with full user data
        const token = jwt.sign(
            { user: userForToken },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return Response(res, 201, 'User registered successfully', {
            user: userForToken,
            token
        });

    } catch (error) {
        return Response(res, 500, error.message);
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return Response(res, 400, 'Invalid credentials');
        }

        let data = await User.find()
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return Response(res, 400, 'Invalid credentials');
        }

        // Remove password from token data
        const userForToken = user.toObject();
        delete userForToken.password;

        // Create JWT token with full user data
        const token = jwt.sign(
            { user: userForToken },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        return Response(res, 200, 'Login successful', {
            user: userForToken,
            token,
            message: 'Login Successfull!'
        });

    } catch (error) {
        return Response(res, 500, error.message);
    }
};

// Get current user
exports.me = async (req, res) => {
    try {
        return Response(res, 200, 'User details retrieved successfully', {
            user: req.user
        });
    } catch (error) {
        return Response(res, 500, error.message);
    }
};

// Get all user details
exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return Response(res, 404, 'User not found');
        }
        return Response(res, 200, 'User details retrieved successfully', { user });
    } catch (error) {
        return Response(res, 500, error.message);
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const {
            name,
            bio,
            studentDetails,
            collegeStudentDetails,
            counsellorDetails
        } = req.body;

        // Find user and update
        const user = await User.findById(userId);
        if (!user) {
            return Response(res, 404, 'User not found');
        }

        // Update basic info
        if (name) user.name = name.trim();
        if (bio) user.bio = bio.trim();

        // Update role-specific details based on user's role
        switch (user.roles) {
            case 'student':
                if (studentDetails) {
                    user.studentDetails = {
                        ...user.studentDetails,
                        ...studentDetails
                    };
                }
                break;
            case 'collage_student':
                if (collegeStudentDetails) {
                    user.collegeStudentDetails = {
                        ...user.collegeStudentDetails,
                        ...collegeStudentDetails
                    };
                }
                break;
            case 'counsellor':
                if (counsellorDetails) {
                    user.counsellorDetails = {
                        ...user.counsellorDetails,
                        ...counsellorDetails
                    };
                }
                break;
        }

        await user.save();

        // Remove password from response
        const updatedUser = user.toObject();
        delete updatedUser.password;

        return Response(res, 200, 'Profile updated successfully', { user: updatedUser });
    } catch (error) {
        return Response(res, 500, error.message);
    }
};

