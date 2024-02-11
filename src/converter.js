const recipeModel = require("../database/recipe.model");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const convertRecipeToText = async () => {
  const recipes = await recipeModel.find();
  for (let i of recipes) {
    if (i.url.includes("giallozafferano")) {
      await convertGZ(i);
    } else await convertAllRecipe(i);
  }
};

const convertGZ = async (recipe) => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(recipe.url, { waitUntil: "domcontentloaded" });
};

const convertAllRecipe = async (recipe) => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(recipe.url, { waitUntil: "domcontentloaded" });
};

module.exports = { convertRecipeToText };
