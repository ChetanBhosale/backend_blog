const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
dotenv.config();
// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER
});

exports.uploadImage = async (req, res, next) => {
    try {
        // Check if req.files exists and has image property
        if (!req.files || !req.files.image) {
            return next();
        }

        const { image } = req.files;
        const result = await cloudinary.uploader.upload(image.tempFilePath, {
            folder: process.env.CLOUDINARY_FOLDER,
            resource_type: 'auto'
        });
        
        req.body.image = result.url;
        next();

    } catch (error) {
        console.error('Error uploading image:', error);
        return res.status(500).json({
            message: "Error uploading image",
            error: error.message
        });
    }
}