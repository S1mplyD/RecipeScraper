const scrapeWeb = require("./scraper").scrapeWeb;
const mongoose = require("mongoose");
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(__dirname, "..", ".env") });
const fs = require("fs");

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO || "")
  .then(async () => {
    let sitesRaw = fs.readFileSync("sites.json");
    const sites = JSON.parse(sitesRaw);
    console.log(sites);

    console.log("connected to mongoose");
    for (i of sites) await scrapeWeb(i);
    console.log("[Preparing to steal some data...]");
  })
  .catch((error) => {
    console.log(error);
  });

// ,
// {
//   "uri": "https://www.allrecipes.com/recipes/17138/world-cuisine/european/french/main-dishes/",
//   "totalPages": 1,
//   "downloadedPages": 0
// },
// {
//   "uri": "https://www.allrecipes.com/recipes/1828/world-cuisine/european/french/desserts/",
//   "totalPages": 1,
//   "downloadedPages": 0
// },
// {
//   "uri": "https://www.allrecipes.com/recipes/1829/world-cuisine/european/french/soups-and-stews/",
//   "totalPages": 1,
//   "downloadedPages": 0
// },
// {
//   "uri": "https://www.allrecipes.com/recipes/1848/world-cuisine/european/french/appetizers/",
//   "totalPages": 1,
//   "downloadedPages": 0
// },
// {
//   "uri": "https://www.allrecipes.com/recipes/16126/world-cuisine/european/french/french-bread/",
//   "totalPages": 1,
//   "downloadedPages": 0
// },
// {
//   "uri": "https://www.allrecipes.com/recipes/17846/world-cuisine/european/spanish/main-dishes/",
//   "totalPages": 1,
//   "downloadedPages": 0
// },
// {
//   "uri": "https://www.allrecipes.com/recipes/17847/world-cuisine/european/spanish/appetizers/",
//   "totalPages": 1,
//   "downloadedPages": 0
// },
// {
//   "uri": "https://www.allrecipes.com/recipes/17848/world-cuisine/european/spanish/soups-and-stews/",
//   "totalPages": 1,
//   "downloadedPages": 0
// },
// {
//   "uri": "https://www.allrecipes.com/recipes/242/drinks/sangria/",
//   "totalPages": 1,
//   "downloadedPages": 0
// },
// {
//   "uri": "https://www.allrecipes.com/recipes/716/world-cuisine/european/eastern-european/russian/",
//   "totalPages": 1,
//   "downloadedPages": 0
// }
