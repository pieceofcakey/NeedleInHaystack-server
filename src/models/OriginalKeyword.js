const mongoose = require("mongoose");

const originalKeywordSchema = new mongoose.Schema({
  text: {
    type: String,
    unique: true,
  },
});

module.exports = mongoose.model("OriginalKeyword", originalKeywordSchema);
