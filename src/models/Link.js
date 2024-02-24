const mongoose = require("mongoose");

const linkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    unique: true,
  },
  links: {
    type: Array,
    required: true,
    default: [],
  },
});

module.exports = mongoose.model("Link", linkSchema);
