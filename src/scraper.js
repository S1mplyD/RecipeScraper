const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const recipeModel = require("../database/recipe.model");
const fs = require("fs");
const { execSync } = require("child_process");

async function scrapeWeb(site) {
  console.log(site);
  if (site.uri.includes("giallozafferano.it")) {
    if (site.downloadedPages > 0 && site.downloadedPages <= site.totalPages)
      await giallozafferano(
        site.uri + `/page${site.downloadedPages + 1}`,
        site.uri,
        "it",
      );
    else await giallozafferano(site.uri, site.uri, "it");
  } else if (site.uri.includes("allrecipes.com")) {
    await allRecipesList(site.uri, site.category);
    // await allrecipes(site.uri, site.uri);
  } else if (site.uri.includes("giallozafferano.com")) {
    if (site.downloadedPages > 0 && site.downloadedPages <= site.totalPages)
      await giallozafferano(
        site.uri + `/page${site.downloadedPages + 1}`,
        site.uri,
        "en",
      );
    else await giallozafferano(site.uri, site.uri, "en");
  } else console.log("not supported");
}

async function giallozafferano(site, originalSite, lang) {
  console.log("[Stealing from GZ...]");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(site, { waitUntil: "domcontentloaded" });
  const articles = await page.$$("article.gz-card");

  let result = await Promise.all(
    articles.map(async (el) => {
      return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
    }),
  );
  console.log(result[0]);
  for (let i of result) {
    const $ = cheerio.load(i);
    await page.goto($(".gz-title a").attr("href"), {
      waitUntil: "domcontentloaded",
    });
    const newPage = await page.$$(".gz-name-featured-data-other");
    let featuredData = await Promise.all(
      newPage.map(async (el) => {
        return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
      }),
    );
    const category = $(".gz-category").text();
    if (category === "" || category === undefined || category === null) {
      await recipeModel.create({
        url: $(".gz-title a").attr("href"),
        category: "",
        desc: $(".gz-description").text(),
        img: $(".gz-card-image img").attr("src"),
        lang: lang,
        name: $(".gz-title").text(),
        featuredData: featuredData,
      });
    } else {
      await recipeModel.create({
        url: $(".gz-title a").attr("href"),
        category: category,
        desc: $(".gz-description").text(),
        img: $(".gz-card-image img").attr("src"),
        lang: lang,
        name: $(".gz-title").text(),
        featuredData: featuredData,
      });
    }
  }
  const file = fs.readFileSync("sites.json", "utf-8");
  const jsonArray = JSON.parse(file);
  const edit = jsonArray.find((el) => {
    return el.uri === originalSite;
  });
  if (edit) {
    edit.downloadedPages = edit.downloadedPages + 1;
  }
  const jsonString = JSON.stringify(jsonArray, null, 2);
  fs.writeFile("sites.json", jsonString, "utf8", (err) => {
    if (err) {
      console.error("Errore nella scrittura del file JSON:", err);
    } else {
      console.log("File JSON modificato con successo.");
    }
  });

  await browser.close();
}

async function allRecipesList(url, category) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const indexList = await page.$$(".alphabetical-list");
  let indexes = await Promise.all(
    indexList.map(async (el) => {
      return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
    }),
  );

  await browser.close();
  for (let i of indexes) {
    const $ = cheerio.load(i);
    const len = $(".link-list__link").length;

    for (let j = 0; j < len; j++) {
      const url = $(".link-list__link")[j].attribs.href;
      const cat = $(".link-list__link")
        [j].children[0].data.replaceAll("\t", "")
        .replaceAll("\n", "")
        .replace(" ", "");
      await allrecipes(url, cat, category);
    }
  }
}

async function allrecipes(site, cat, category) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(site, { waitUntil: "domcontentloaded" });

  const articles = await page.$$("#taxonomysc_1-0");
  let result = await Promise.all(
    articles.map(async (el) => {
      return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
    }),
  );

  await browser.close();
  for (let i of result) {
    const $ = cheerio.load(i);
    for (let j in $(".card")) {
      if (!($(".card")[j].attribs === undefined))
        await newSearch($(".card")[j].attribs.href, cat, category);
      // execSync("sleep 5");
    }
  }
}

async function newSearch(url, cat, category) {
  try {
    if (!(url.includes("article") || url.includes("gallery"))) {
      const browser2 = await puppeteer.launch({ headless: "new" });
      const page2 = await browser2.newPage();
      await page2.goto(url, { waitUntil: "domcontentloaded" });
      const article = await page2.$$("#allrecipes-article_1-0");
      let result = await Promise.all(
        article.map(async (el) => {
          return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
        }),
      );

      const $ = cheerio.load(result[0]);

      const img = $(".primary-image__image").attr("src");
      console.log(url);

      const recipe = await recipeModel.findOne({ url: url });
      let desc = $("#article-subheading_1-0").text();
      let name = $("#article-heading_1-0").text();
      if (!recipe) {
        if (category == "ingredients") {
          console.log("adding new recipe");
          if (img !== undefined) {
            await recipeModel.create({
              url: url,
              ingredients: cat,
              desc: desc.replaceAll("\n", "").replaceAll("\t", ""),
              img: img,
              lang: "en",
              name: name.replaceAll("\n", "").replaceAll("\t", ""),
            });
          } else {
            await recipeModel.create({
              url: url,
              ingredients: cat,
              desc: desc.replaceAll("\n", "").replaceAll("\t", ""),
              img: "",
              lang: "en",
              name: name.replaceAll("\n", "").replaceAll("\t", ""),
            });
          }
        } else if (category == "category") {
          console.log("adding new recipe");
          if (img !== undefined) {
            await recipeModel.create({
              url: url,
              category: cat,
              desc: desc.replaceAll("\n", "").replaceAll("\t", ""),
              img: img,
              lang: "en",
              name: name.replaceAll("\n", "").replaceAll("\t", ""),
            });
          } else {
            await recipeModel.create({
              url: url,
              category: cat,
              desc: desc.replaceAll("\n", "").replaceAll("\t", ""),
              img: "",
              lang: "en",
              name: name.replaceAll("\n", "").replaceAll("\t", ""),
            });
          }
        } else if (category == "cuisine") {
          console.log("adding new recipe");
          if (img !== undefined) {
            await recipeModel.create({
              url: url,
              cuisine: cat,
              desc: desc.replaceAll("\n", "").replaceAll("\t", ""),
              img: img,
              lang: "en",
              name: name.replaceAll("\n", "").replaceAll("\t", ""),
            });
          } else {
            await recipeModel.create({
              url: url,
              cuisine: cat,
              desc: desc.replaceAll("\n", "").replaceAll("\t", ""),
              img: "",
              lang: "en",
              name: name.replaceAll("\n", "").replaceAll("\t", ""),
            });
          }
        }
      }
      await browser2.close();
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  scrapeWeb,
};
