const dotenv = require("dotenv");
const Blog = require("../model/Blog.model");
const User = require("../model/User.model")
const { GoogleGenAI } = require("@google/genai");
const { Response } = require("../services/Response");
const { scrapeContent } = require("../services/scrape");
const xml2js = require("xml2js");
const Pages = require("../model/Pages.model");
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.createBlog = async (req, res) => {
  let { title, content, tags, image = "" } = req.body;

  try {
    tags = tags.split(",").map((tag) => tag.trim().toLowerCase());
    console.log({ image });

    let countDoc = await Blog.countDocuments({ user : req.user._id, isFeatured : true });

    let isFeatured = countDoc > 6 ? false : true;

    const blog = await Blog.create({ title, content, tags, image, user : req.user._id, isFeatured : isFeatured });

    return Response(res, 201, "Blog created successfully", blog);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getFeaturedBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isFeatured : true });
    console.log({ blogs });
    return Response(res, 200, "Blogs fetched successfully", blogs);
  } catch (error) {
    return Response(res, 500, error.message);
  }
};

exports.getAdminBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();
    console.log({ blogs });
    return Response(res, 200, "Blogs fetched successfully", blogs);
  } catch (error) {
    return Response(res, 500, error.message);
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return Response(res, 400, "Blog id is required");
    }
    const blogId = await Blog.findById(id).populate('user', 'name email');
    if (!blogId) {
      return Response(
        res,
        404,
        "blog with provided id not found, please provide a valid blog id",
        blogId
      );
    }
    console.log(blogId);
    return Response(res, 200, "blog data fetch successfully.", blogId);
  } catch (error) {
    return Response(res, 500, error.message);
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const { title, content, tags, isFeatured } = req.body;

    // Find the blog
    const existingBlog = await Blog.findById(blogId);
    if(existingBlog.isFeatured !== isFeatured && typeof isFeatured === 'boolean'){
      let countDoc = await Blog.countDocuments({ user : req.user._id, isFeatured : true });
      if(countDoc > 6){
        return res.status(400).json({ message: "You can't have more than 6 featured blogs" });
      }
    }
    if (!existingBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    // Prepare updated data
    let updatedData = {
      title,
      content,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      isFeatured
    };

    // If new image uploaded, convert to base64
    if (req.file) {
      const imageBuffer = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;
      updatedData.image = `data:${mimeType};base64,${imageBuffer}`;
    }

    // Update blog
    const updatedBlog = await Blog.findByIdAndUpdate(blogId, updatedData, {
      new: true,
    });

    res.status(200).json({
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error.message);
    res.status(500).json({ message: "Something went wrong" });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const { id } = req.body;
    const isBlogExists = await Blog.findByIdAndDelete(id);
    res.status(200).json({ message: "blog deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

async function generateContentWithAI(scrapedData, userPrompt) {
  try {
    const prompt = `
    You are a professional blog content writer. 
    
    I'm going to give you information from a webpage and I want you to create a well-structured blog post based on this information and my specific instructions.
    
    SCRAPED DATA:
    URL: ${scrapedData.metadata.url}
    TITLE: ${scrapedData.title}
    CONTENT SUMMARY: ${scrapedData.content.substring(0, 2000)}...
    
    USER INSTRUCTIONS:
    ${userPrompt}
    
    IMPORTANT: Format your response as a valid XML document with these exact tags:
    - <title>: The blog post title (compelling and SEO-friendly)
    - <content>: The complete blog post content in HTML format (include proper h1, h2, h3, p, ul, li, etc. tags)
    - <tags>: 3-5 comma-separated relevant keywords/tags for the blog post
    
    The XML should look like:
    <title>Your Generated Title Here</title>
    <content><h1>Main Heading</h1><p>First paragraph...</p>...</content>
    <tags>tag1,tag2,tag3</tags>
    
    Make sure to:
    1. Write in a professional, engaging tone
    2. Include relevant headings and subheadings (h1, h2, h3)
    3. Make content at least 700 words with proper HTML formatting
    4. Create content that's original and not copied from the source
    5. Include a strong intro and conclusion
    6. dont include html body and head tags, just start from direct content of div and h1 whatever you like which should be inside <content> tags
    `;

    const result = await await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    // const result = await model.generateContent(prompt);
    const generatedText = result.text;

    // const generatedText = response.text();

    // Validate that the response contains valid XML
    if (
      !generatedText.includes("<title>") ||
      !generatedText.includes("<content>") ||
      !generatedText.includes("<tags>")
    ) {
      throw new Error("AI did not generate content in the correct XML format");
    }

    return generatedText;
  } catch (error) {
    console.error("Error generating content with AI:", error.message);
    throw new Error(`Failed to generate content with AI: ${error.message}`);
  }
}

async function parseXmlContent(xmlString) {
  try {
    // Clean up the XML to ensure it's well-formed
    let cleanedXml = xmlString.trim();

    // If the XML is not wrapped in a root element, wrap it
    if (!cleanedXml.startsWith("<?xml") && !cleanedXml.startsWith("<root>")) {
      cleanedXml = `<root>${cleanedXml}</root>`;
    }

    // Use regex to extract parts directly (as backup method)
    const titleMatch = cleanedXml.match(/<title>(.*?)<\/title>/s);
    const contentMatch = cleanedXml.match(/<content>(.*?)<\/content>/s);
    const tagsMatch = cleanedXml.match(/<tags>(.*?)<\/tags>/s);

    const title = titleMatch ? titleMatch[1] : "";
    const content = contentMatch ? contentMatch[1] : "";
    const tagsString = tagsMatch ? tagsMatch[1] : "";

    const tags = tagsString.split(",").map((tag) => tag.trim());

    return {
      title,
      content,
      tags,
    };
  } catch (error) {
    console.error("Error parsing XML content:", error);
    throw new Error(`Failed to parse XML content: ${error.message}`);
  }
}

exports.createContentUsingAI = async (req, res) => {
  try {
    const { link, prompt } = req.body;

    if (!link || !prompt) {
      return Response(res, 400, "Link and prompt are required");
    }

    // Step 1: Scrape content from the provided link
    const scrapedData = await scrapeContent(link);

    console.log({ scrapedData });

    // Step 2: Generate blog content using AI based on scraped data and prompt
    const xmlContent = await generateContentWithAI(scrapedData, prompt);

    // Step 3: Parse the XML content
    const parsedContent = await parseXmlContent(xmlContent);

    // Return the generated content
    return Response(res, 200, "Content generated successfully", {
      xmlContent,
      parsedContent,
    });
  } catch (error) {
    console.error("Error in createContentUsingAI:", error);
    return Response(res, 500, error.message || "Failed to generate content");
  }
};

exports.getPageData = async (req, res) => {
  try {
    const pagesData = await Pages.find();
    
    if (!pagesData || pagesData.length === 0) {
      return Response(res, 404, "No pages found");
    }

    return Response(res, 200, "Pages data fetched successfully", pagesData);
  } catch (error) {
    console.error("Error in getPageData:", error);
    return Response(res, 500, error.message || "Failed to fetch pages data");
  }
};

exports.updatePageData = async (req, res) => {
  try {
    const { pageType } = req.params;
    const { description } = req.body;

    if (!pageType || !description) {
      return Response(res, 400, "Page type and description are required");
    }

    const updatedPage = await Pages.findOneAndUpdate(
      { title: pageType },
      { description },
      { new: true, upsert: true }
    );

    return Response(res, 200, "Page data updated successfully", updatedPage);
  } catch (error) {
    console.error("Error in updatePageData:", error);
    return Response(res, 500, error.message || "Failed to update page data");
  }
};
