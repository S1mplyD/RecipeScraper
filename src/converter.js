const recipeModel = require("../database/recipe.model");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

const convertRecipeToText = async () => {
  // const recipes = await recipeModel.find({
  //   url: { $regex: "allrecipes", $options: "i" },
  // });
  const recipes = await recipeModel.find({
    directions: { $exists: false },
  });
  for (let i of recipes) {
    if (i.url.includes("giallozafferano")) {
      await convertGZ(i);
    } else await convertAllRecipe(i);
  }
};

const convertGZ = async (recipe) => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(recipe.url, { waitUntil: "domcontentloaded" });
    const ingredients = await page.$$(".gz-list-ingredients");
    let result = await Promise.all(
      ingredients.map(async (el) => {
        return await el.evaluate((x) =>
          x.innerHTML.replaceAll("\t", "").replaceAll("\n", ""),
        );
      }),
    );
    console.log(recipe.url);
    let ingredientsList = [];
    for (let i in result) {
      const $ = cheerio.load(result[i]);
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
    const directions = await page.$$(".gz-content-recipe");

    const newResult = await Promise.all(
      directions.map(async (el) => {
        return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
      }),
    );
    let directionsString = "";
    for (let i in newResult) {
      const $ = cheerio.load(newResult[i]);
      $(".gz-content-recipe-step-img-container").remove();
      $(".num-step").remove();
      let direction = $(".gz-content-recipe-step")
        .text()
        .replaceAll("\t", "")
        .replaceAll("\n", "");
      if (direction !== "") {
        directionsString = direction;
      }
    }
    await browser.close();
    await recipeModel.updateOne(
      { url: recipe.url },
      {
        $set: { ingredients: ingredientsList },
        directions: directionsString,
      },
    );
  } catch (e) {
    console.log(e);
  }
};

const convertAllRecipe = async (recipe) => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(recipe.url, { waitUntil: "domcontentloaded" });
    const ingredients = await page.$$(
      ".mntl-structured-ingredients__list-item",
    );

    let result = await Promise.all(
      ingredients.map(async (el) => {
        return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
      }),
    );
    console.log(recipe.url);

    let ingredientsString = [];
    for (let i in result) {
      const $ = cheerio.load(result[i]);
      let inString = $("p").text();
      ingredientsString.push(inString);
    }
    const directions = await page.$("#recipe__steps_1-0");
    const newresult = await directions.evaluate((x) =>
      x.innerHTML.replace("\t", ""),
    );
    const $ = cheerio.load(newresult);
    $("figure").remove();
    let directionsString = $("li")
      .text()
      .replaceAll("\t", "")
      .replaceAll("\n", "");

    await browser.close();

    await recipeModel.updateOne(
      { url: recipe.url },
      {
        $set: { ingredients: ingredientsString },
        directions: directionsString,
      },
    );
  } catch (e) {
    console.log(e);
  }
};

module.exports = { convertRecipeToText };
