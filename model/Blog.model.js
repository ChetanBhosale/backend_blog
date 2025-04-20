const mongoose = require('mongoose');

// const Blog = mongoose.model('Blog', {
//     title : String,
//     content : String,
//     tags : [String],
//     image : String,
// },{timestamps : true})

const BlogSchema = new mongoose.Schema({
    title : String,
    content : String,
    tags : [String],
    image : String,
},{timestamps : true})

const Blog = mongoose.model('Blog', BlogSchema);   


module.exports = Blog;