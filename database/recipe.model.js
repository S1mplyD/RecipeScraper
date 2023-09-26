const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  img: { type: String },
  name: { type: String, required: true },
  category: { type: String },
  ingredients: { type: [String] },
  cuisine: { type: String },
  desc: { type: String, required: true },
  lang: { type: String, required: true },
  featuredData: { type: [String] },
});

const recipeModel = mongoose.model("recipeData", recipeSchema);

module.exports = recipeModel;
