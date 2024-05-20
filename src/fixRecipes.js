const recipeModel = require("../database/recipe.model");

const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const fixUndefined = async () => {
  const recipes = await recipeModel.find().lean();
  for (let i of recipes) {
    if (i.url.includes("giallozafferano")) {
      for (let j of i.ingredients) {
        if (j.includes("undefined")) await fixGZ(i);
      }
    } else if (i.url.includes("allrecipes")) {
      for (let j of i.ingredients) {
        if (j.includes("undefined")) await fixAR(i);
      }
    }
  }
  console.log("EOD");
};

const fixGZ = async (recipe) => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(recipe.url, { waitUntil: "domcontentloaded" });
    const ingredients = await page.$$(".gz-list-ingredients");
    let result = await Promise.all(
      ingredients.map(async (el) => {
        return await el.evaluate((x) =>
          x.innerHTML.replaceAll("\t", "").replaceAll("\n", "")
        );
      })
    );
    console.log(recipe.url);
    let ingredientsList = [];
    for (let i in result) {
      const $ = cheerio.load(result[i]);
      $("picture").remove();
      $("i").each(function () {
        const text = $(this).text();
        $(this).replaceWith(text);
      });
      $("dd").each(function (i, elem) {
        let ingredientString = "";
        let ingredient = "";
        for (let j of elem.children) {
          for (let k of j.children) {
            ingredient = k.data;
          }
          ingredientString += ingredient + " ";
        }
        ingredientsList.push(ingredientString);
      });
    }
    await browser.close();
    console.log(ingredientsList);
    await recipeModel.updateOne(
      { url: recipe.url },
      { $set: { ingredients: ingredientsList } }
    );
  } catch (e) {
    console.log(e);
  }
};

const fixAR = async (recipe) => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(recipe.url, { waitUntil: "domcontentloaded" });
    const ingredients = await page.$$(
      ".mntl-structured-ingredients__list-item"
    );

    let result = await Promise.all(
      ingredients.map(async (el) => {
        return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
      })
    );
    console.log(recipe.url);

    let ingredientsString = [];
    for (let i in result) {
      const $ = cheerio.load(result[i]);
      let inString = $("p").text();
      ingredientsString.push(inString);
    }
    await browser.close();
    console.log(ingredientsString);
  } catch (e) {
    console.log(e);
  }
};

module.exports = fixUndefined;
