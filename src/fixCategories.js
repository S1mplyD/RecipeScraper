const recipeModel = require("../database/recipe.model");

const fixCategories = async () => {
  const recipes = await recipeModel.find();
  for (let i of recipes) {
    console.log(i.url);
    if (!i.cuisine) {
      await recipeModel.updateOne({ url: i.url }, { cuisine: "" });
    }
    if (!i.category) {
      await recipeModel.updateOne({ url: i.url }, { category: "" });
    }
    if (!i.ingredients || i.ingredients.length < 1) {
      await recipeModel.updateOne({ url: i.url }, { ingredients: [] });
    }
  }
};

module.exports = { fixCategories };
