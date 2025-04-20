const Blog = require("../model/Blog.model")
const { Response } = require("../services/Response")

exports.getBlogs = async(req,res) => {
    try {
        let {page=1, limit=10, search, tags=""} = req.query
        limit = parseInt(limit)
        page = parseInt(page)

        const blogs = await Blog.aggregate([
            {
                $match: {
                    ...(tags && {tags: { $in: tags.split(',') }})
                }
            },
            {
                $match :{
                    content : { $regex: search, $options: 'i' }
                }
            },
            {
                $match: {
                    title: { $regex: search, $options: 'i' }
                }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: limit
            }
        ])
        return Response(res, 200, "Blogs fetched successfully", blogs)
    } catch (error) {
        console.log({error})
        return Response(res, 500, error.message)
    }
}

exports.getPopulurTags = async(req,res) => {
    try {
        const tags = await Blog.aggregate([
            {
                $unwind: "$tags"
            },
            {
                $group: {
                    _id: "$tags",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: {
                    count: -1
                }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    tag: "$_id",
                    count: 1,
                    _id: 0
                }
            }
        ])
        return Response(res, 200, "Popular tags fetched successfully", tags)
    } catch (error) {
        return Response(res, 500, error.message)
    }
}

exports.getRelatedBlogs = async(req,res) => {
    try {
        const {tags, search} = req.query
        const blogs = await Blog.aggregate([
            {
                $match: {
                    tags: { $in: tags.split(',') }
                }
            },
            {
                $match: {
                    title: { $regex: search, $options: 'i' }
                }
            },
            {
                $limit: 5
            }
        ])  
        return Response(res, 200, "Related blogs fetched successfully", blogs)
    } catch (error) {
        return Response(res, 500, error.message)
    }
}