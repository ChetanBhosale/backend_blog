const mongoose = require("mongoose");

const pagesSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      unique: true,
      enum: ["about-us", "privacy-policy", "terms-of-use"]
    },
    description: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Pages", pagesSchema); 