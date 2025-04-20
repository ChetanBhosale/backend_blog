const axios = require("axios");
const cheerio = require("cheerio");

exports.scrapeContent = async (url) => {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      $('script').remove();
      $('style').remove();
      $('noscript').remove();
      $('iframe').remove();
      
      // Extract main content - prioritize main content areas
      let content = '';
      
      // Try to get content from specific content areas first
      const contentSelectors = [
        'article', 'main', '.content', '.post-content', 
        '.article-content', '#content', '.entry-content'
      ];
      
      for (const selector of contentSelectors) {
        if ($(selector).length > 0) {
          content += $(selector).text() + ' ';
        }
      }
      
      // If no content found with specific selectors, get body text
      if (!content.trim()) {
        content = $('body').text();
      }
      
      // Extract title
      const title = $('title').text() || $('h1').first().text();
      
      // Extract meta tags for keywords
      const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
      
      return {
        title: title,
        content: content.trim(),
        metadata: {
          url: url,
          keywords: metaKeywords,
        }
      };
    } catch (error) {
      console.error('Error scraping content:', error.message);
      throw new Error(`Failed to scrape content from ${url}: ${error.message}`);
    }
  }