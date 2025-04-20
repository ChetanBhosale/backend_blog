const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

exports.createBlog = async (req, res) => {
  const { title, content, tags } = req.body;

  console.log("Title:", title);
  console.log("Content:", content);
  console.log("Tags:", tags);
  res.json({
    message: title,
  });
};
