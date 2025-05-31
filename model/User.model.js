const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: function() {
            return this.isEmailVerified; // Only required after email verification
        },
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function() {
            return this.isEmailVerified; // Only required after email verification
        }
    },
    role: {
        type: String,
        enum: ['student', 'collage_student', 'counsellor'],
        required: function() {
            return this.isEmailVerified; // Only required after email verification
        }
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        code: String,
        expiresAt: Date
    },
    bio: String,
    studentDetails: {
        type: Object,
        default: {}
    },
    collegeStudentDetails: {
        type: Object,
        default: {}
    },
    counsellorDetails: {
        type: Object,
        default: {}
    },
    isBanned : {
        type : Boolean,
        default : false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
