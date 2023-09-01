const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const recipeModel = require("../database/recipe.model");
const fs = require("fs");

async function scrapeWeb(site) {
  if (site.uri.includes("giallozafferano.it")) {
    if (site.downloadedPages > 0)
      giallozafferano(site.uri + `/page${site.downloadedPages + 1}`, site.uri);
    else giallozafferano(site.uri, site.uri);
  } else if (site.uri.includes("allrecipes.com")) {
    allrecipes(site.uri);
  } else console.log("not supported");
}

async function giallozafferano(site, originalSite) {
  // {
  //   "uri": "https://www.giallozafferano.it/ricette-cat/",
  //   "totalPages": 437,
  //   "downloadedPages": 5
  // },
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(site, { waitUntil: "domcontentloaded" });
  const articles = await page.$$("article.gz-card");

  let result = await Promise.all(
    articles.map(async (el) => {
      return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
    })
  );

  for (let i of result) {
    const $ = cheerio.load(i);
    await recipeModel.create({
      url: $(".gz-title a").attr("href"),
      category: $(".gz-category").text(),
      desc: $(".gz-description").text(),
      img: $(".gz-card-image img").attr("src"),
      lang: "it",
      name: $(".gz-title").text(),
    });
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

async function allrecipes(site) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(site, { waitUntil: "domcontentloaded" });

  const articles = await page.$$(".mntl-card-list");
  let result = await Promise.all(
    articles.map(async (el) => {
      return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
    })
  );

  const $ = cheerio.load(result[0]);
  // console.log(result[0]);
  // url
  // console.log($("a").attr("href"));
  // //category
  // console.log($(".card__content").data("tag"));
  // //desc

  // //img
  // console.log($("img").attr("src"));
  //lang

  //name
  // console.log($(".card__title-text"));
  const url = $("a").attr("href");

  await browser.close();
  await newSearch(url);

  // for (let i of result) {
  //   const $ = cheerio.load(i);
  //   await recipeModel.create({
  //     url: $("a").attr("href"),
  //     category: $(".card__content").data("tag"),
  //     desc: ,
  //     img: $("img").attr("src"),
  //     lang: ,
  //     name: ,
  //   });
  // }
}

async function newSearch(url) {
  const browser2 = await puppeteer.launch({ headless: "new" });
  const page2 = await browser2.newPage();
  await page2.goto(url, { waitUntil: "domcontentloaded" });
  const article = await page2.$$(".article-post-header");
  let result = await Promise.all(
    article.map(async (el) => {
      return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
    })
  );
  const $ = cheerio.load(result[0]);
  //nome
  console.log($("#article-heading_1-0").text());
  //desc
  console.log($("#article-subheading_1-0").text());
}

module.exports = {
  scrapeWeb,
};
