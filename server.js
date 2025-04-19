const express = require('express');
const app = express();
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./model/User.model');
const bcrypt = require('bcryptjs');

dotenv.config();
const cors = require('cors');

app.use(cors());
app.use(express.json());

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

app.listen(PORT, async () => {
    console.log(`Server is running on port ${PORT}`);
    await connectDB();
    // Create admin account after database connection
    // await createAdminAccount();
});
