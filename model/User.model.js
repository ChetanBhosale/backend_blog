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
        default: {
            school_name: '',
            grade: '',
            phone: '',
            parent_name: '',
            parent_phone: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            date_of_birth: '',
            gender: '',
            interests: [],
            achievements: []
        }
    },
    collegeStudentDetails: {
        type: Object,
        default: {
            college_name: '',
            college_email: '',
            college_id: '',
            course: '',
            semester: '',
            department: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            date_of_birth: '',
            gender: '',
            skills: [],
            projects: [],
            internships: [],
            cgpa: ''
        }
    },
    counsellorDetails: {
        type: Object,
        default: {
            qualification: '',
            specialization: '',
            experience_years: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            date_of_birth: '',
            gender: '',
            languages_known: [],
            certifications: [],
            consultation_fee: '',
            availability: {
                monday: { start: '', end: '' },
                tuesday: { start: '', end: '' },
                wednesday: { start: '', end: '' },
                thursday: { start: '', end: '' },
                friday: { start: '', end: '' },
                saturday: { start: '', end: '' },
                sunday: { start: '', end: '' }
            },
            bio: '',
            expertise_areas: []
        }
    },
    isBanned: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
