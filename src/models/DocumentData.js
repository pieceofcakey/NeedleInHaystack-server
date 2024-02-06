const mongoose = require("mongoose");

const documentDataSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  value: {
    type: Number,
  },
});

module.exports = mongoose.model("DocumentData", documentDataSchema);
