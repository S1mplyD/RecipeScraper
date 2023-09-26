const recipeModel = require("../database/recipe.model");

async function deleteRegex(regex) {
  await recipeModel.deleteMany({ url: { $regex: regex, $options: "i" } });
}

module.exports = { deleteRegex };
