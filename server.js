const express = require('express');
const app = express();
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./model/User.model');
const bcrypt = require('bcryptjs');
const morgan = require('morgan');

const fileUpload = require('express-fileupload');
const path = require('path');
dotenv.config();
const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080', "http://localhost:8082","https://blogstudent-portal-nexus-dkm3.vercel.app"],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.urlencoded({ extended: true }));

app.use(fileUpload(
    {
        useTempFiles: true,
        tempFileDir: './temp/',
        limits: {
            fileSize: 1024 * 1024 * 20, // 5MB
        },
        abortOnLimit: true,
        createParentPath: true,
    }
));

app.use(morgan('dev'));
app.use(express.json({
    limit: '50mb',
    extended: true,
}));

const PORT = process.env.PORT || 8000;

// Function to create admin account
// const createAdminAccount = async () => {
//     try {
//         // Check if admin already exists
//         const adminExists = await User.findOne({ email: 'admin@gmail.com' });
        
//         if (!adminExists) {
//             // Hash password
//             const salt = await bcrypt.genSalt(10);
//             const hashedPassword = await bcrypt.hash('123456789', salt);
            
//             // Create admin user
//             const adminUser = new User({
//                 name: 'Admin',
//                 email: 'admin@gmail.com',
//                 password: hashedPassword,
//                 roles: 'admin'
//             });
            
//             await adminUser.save();
//             console.log('Admin account created successfully');
//         } else {
//             console.log('Admin account already exists');
//         }
//     } catch (error) {
//         console.error('Error creating admin account:', error.message);
//     }
// };

const index = require("./routes/index.routes")
const blogRoutes = require("./routes/blog.routes")
app.use("/api", index)
app.use("/api/blogs", blogRoutes)
app.get('/healt', async (req, res) => { 
    res.send('Server is running');
})

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
    // Create admin account after database connection
    // await createAdminAccount();
});
