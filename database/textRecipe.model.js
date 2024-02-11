const mongoose = require("mongoose");

const textRecipeSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  img: { type: String },
  name: { type: String, required: true },
  category: { type: String },
  ingredients: { type: [String] },
  cuisine: { type: String },
  desc: { type: String, required: true },
  lang: { type: String, required: true },
  featuredData: { type: [String] },
  directions: { type: String },
});

const textRecipeModel = mongoose.model("textRecipeData", textRecipeSchema);

module.exports = textRecipeModel;
