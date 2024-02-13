const scrapeWeb = require("./scraper").scrapeWeb;
const mongoose = require("mongoose");
const { config } = require("dotenv");
const { resolve } = require("path");
config({ path: resolve(__dirname, "..", ".env") });
const fs = require("fs");
const { deleteRegex } = require("./delete");
const { convertRecipeToText } = require("./converter");
const fixCategories = require("./fixCategories").fixCategories;

mongoose.set("strictQuery", false);
mongoose
  .connect(process.env.MONGO || "")
  .then(async () => {
    // let sitesRaw = fs.readFileSync("sites.json");
    // const sites = JSON.parse(sitesRaw);
    //
    console.log("connected to mongoose");
    // console.log("[Preparing to steal some data...]");
    // // await deleteRegex("allrecipes");
    // for (i of sites) {
    //   await scrapeWeb(i);
    // }
    // const update = await fixCategories();
    // console.log(update);
    await convertRecipeToText();
  })
  .catch((error) => {
    console.log(error);
  });
