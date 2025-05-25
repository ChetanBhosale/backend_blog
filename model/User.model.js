const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name : String,
    email : {
        type : String,
        trim: true,
        required: true,
        lowercase: true,
        unique: true,
        validate : {
            validator : function(v){
                return /^\S+@\S+\.\S+$/.test(v);
            },
            message : 'Please enter a valid email'
        }
    },
    password : {
        type : String,
        required : true,
        minlength : 8
    },
    roles : {
        type : String,
        enum : ['student', 'collage_student', 'admin', "counsellor"],
        default : 'student'
    },
    // Common fields for all users
    bio: {
        type: String,
        trim: true
    },
    // Student specific fields
    studentDetails: {
        collegeDetails: {
            type: String,
            trim: true
        },
        catScore: {
            type: Number
        },
        address: {
            type: String,
            trim: true
        }
    },
    // College student specific fields
    collegeStudentDetails: {
        collegeName: {
            type: String,
            trim: true
        },
        currentYear: {
            type: Number
        },
        branch: {
            type: String,
            trim: true
        },
        collegeEmail: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                validator: function(v) {
                    return /^\S+@\S+\.\S+$/.test(v);
                },
                message: 'Please enter a valid college email'
            }
        }
    },
    // Counsellor specific fields
    counsellorDetails: {
        counsellorEmail: {
            type: String,
            trim: true,
            lowercase: true,
            validate: {
                validator: function(v) {
                    return /^\S+@\S+\.\S+$/.test(v);
                },
                message: 'Please enter a valid counsellor email'
            }
        },
        details: {
            type: String,
            trim: true
        }
    },
    createdAt : {
        type : Date,
        default : Date.now
    }
})

const User = mongoose.model('User', userSchema);

module.exports = User;