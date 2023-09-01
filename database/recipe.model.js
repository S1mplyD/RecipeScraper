import { Schema, model, Document } from "mongoose";

const recipeSchema =
  new Schema() <
  RecipeDocument >
  {
    url: { type: String, required: true },
    img: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    desc: { type: String, required: true },
    lang: { type: String, required: true },
  };

const recipeModel = model < RecipeDocument > ("recipeData", recipeSchema);

export default recipeModel;
