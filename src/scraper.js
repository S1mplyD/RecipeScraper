const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

async function scrapeWeb(site) {
  if (site.uri.includes("giallozafferano.it")) {
    giallozafferano(site.uri);
  } else if (site.uri.includes("allrecipes.com")) {
    allrecipes(site.uri);
  } else console.log("not supported");
}

async function giallozafferano(site) {
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
  const $ = cheerio.load(result[0]);
  //nome ricetta
  console.log($(".gz-title").text());
  //link ricetta
  console.log($(".gz-title a").attr("href"));
  //immagine ricetta
  console.log($(".gz-card-image img").attr("src"));
  //descrizione ricetta
  console.log($(".gz-description").text());

  await browser.close();
}

async function allrecipes(site) {}

module.exports = {
  scrapeWeb,
};
