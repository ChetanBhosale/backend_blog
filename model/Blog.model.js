

const Blog = mongoose.model('Blog', {
    title : String,
    content : String,
    tags : [String],
    image : String,
},{timestamps : true})
