const mongoose = require("mongoose");

const animeSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  genre: { type: [String], default: [] },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  added: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Anime", animeSchema);
