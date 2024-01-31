const mongoose = require("mongoose");

const { Schema } = mongoose;

const keywordSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    unique: true,
  },
  videoIds: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    default: [],
    required: true,
  },
});

module.exports = mongoose.model("Keyword", keywordSchema);
