const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const recipeModel = require("../database/recipe.model");
const fs = require("fs");
const { execSync } = require("child_process");

async function scrapeWeb(site) {
  console.log(site);
  if (site.uri.includes("giallozafferano.it")) {
    if (site.downloadedPages > 0 && site.downloadedPages <= site.totalPages)
      giallozafferano(
        site.uri + `/page${site.downloadedPages + 1}`,
        site.uri,
        "it"
      );
    else giallozafferano(site.uri, site.uri, "it");
  } else if (site.uri.includes("allrecipes.com")) {
    allrecipes(site.uri, site.uri);
  } else if (site.uri.includes("giallozafferano.com")) {
    if (site.downloadedPages > 0 && site.downloadedPages <= site.totalPages)
      giallozafferano(
        site.uri + `/page${site.downloadedPages + 1}`,
        site.uri,
        "en"
      );
    else giallozafferano(site.uri, site.uri, "en");
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
    })
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
      })
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

async function allrecipes(site, originalSite) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(site, { waitUntil: "domcontentloaded" });

  const articles = await page.$$("#taxonomysc_1-0");
  let result = await Promise.all(
    articles.map(async (el) => {
      return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
    })
  );

  await browser.close();
  for (let i of result) {
    const $ = cheerio.load(i);
    for (let j in $(".card")) {
      if (!($(".card")[j].attribs === undefined))
        await newSearch($(".card")[j].attribs.href, originalSite);
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
}

async function newSearch(url, originalSite) {
  if (!(url.includes("article") || url.includes("gallery"))) {
    const browser2 = await puppeteer.launch({ headless: "new" });
    const page2 = await browser2.newPage();
    await page2.goto(url, { waitUntil: "domcontentloaded" });
    const article = await page2.$$("#allrecipes-article_1-0");
    let result = await Promise.all(
      article.map(async (el) => {
        return await el.evaluate((x) => x.innerHTML.replace("\t", ""));
      })
    );

    const $ = cheerio.load(result[0]);

    const img = $(".primary-image__image").attr("src");
    console.log(url);
    const defLast = 3;
    let cat = $(`#mntl-breadcrumbs__item_1-0-${defLast}`).text();
    for (let i = 2; i > 0; i--) {
      if (cat === undefined) {
        cat = $(`#mntl-breadcrumbs__item_1-0-${i}`).text();
      }
    }

    const recipe = await recipeModel.findOne({ url: url });
    let desc = $("#article-subheading_1-0").text();
    let name = $("#article-heading_1-0").text();
    if (!recipe) {
      console.log("adding new recipe");
      if (img !== undefined) {
        await recipeModel.create({
          url: url,
          category: cat.replaceAll("\n", "").replaceAll("\t", ""),
          desc: desc.replaceAll("\n", "").replaceAll("\t", ""),
          img: img,
          lang: "en",
          name: name.replaceAll("\n", "").replaceAll("\t", ""),
        });
      } else {
        await recipeModel.create({
          url: url,
          category: cat.replaceAll("\n", "").replaceAll("\t", ""),
          desc: desc.replaceAll("\n", "").replaceAll("\t", ""),
          img: "",
          lang: "en",
          name: name.replaceAll("\n", "").replaceAll("\t", ""),
        });
      }
    }
    await browser2.close();
  }
}

module.exports = {
  scrapeWeb,
};
