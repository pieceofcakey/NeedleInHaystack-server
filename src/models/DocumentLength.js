const { Decimal128 } = require("mongodb");
const mongoose = require("mongoose");

const documentLengthSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  documentLength: {
    type: Decimal128,
    required: true,
  },
  titleLength: {
    type: Decimal128,
    required: true,
  },
  descriptionLength: {
    type: Decimal128,
    required: true,
  },
  transcriptLength: {
    type: Decimal128,
    required: true,
  },
  tagLength: {
    type: Decimal128,
    required: true,
  },
});

module.exports = mongoose.model("DocumentLength", documentLengthSchema);
