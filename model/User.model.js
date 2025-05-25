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
    createdAt : {
        type : Date,
        default : Date.now
    }
})

const User = mongoose.model('User', userSchema);

module.exports = User;
