const mongoose = require("mongoose");

const documentLengthSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  documentLength: {
    type: mongoose.Decimal128,
    required: true,
  },
  titleLength: {
    type: mongoose.Decimal128,
    required: true,
  },
  descriptionLength: {
    type: mongoose.Decimal128,
    required: true,
  },
  transcriptLength: {
    type: mongoose.Decimal128,
    required: true,
  },
  tagLength: {
    type: mongoose.Decimal128,
    required: true,
  },
});

module.exports = mongoose.model("DocumentLength", documentLengthSchema);
