const scrapeWeb = require("./scraper").scrapeWeb;
const mongoose = require("mongoose");
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(__dirname, "..", ".env") });
const fs = require("fs");

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO || "")
  .then(() => {
    let sitesRaw = fs.readFileSync("sites.json");
    const sites = JSON.parse(sitesRaw);
    console.log(sites);

    console.log("connected to mongoose");
    let i = 0;
    setInterval(async () => {
      if (i < sites.length) {
        await scrapeWeb(sites[i]);
        i++;
      }
    }, Math.random() * 10000);
  })
  .catch((error) => {
    console.log(error);
  });
