const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  img: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  desc: { type: String, required: true },
  lang: { type: String, required: true },
});

const recipeModel = mongoose.model("recipeData", recipeSchema);

module.exports = recipeModel;
