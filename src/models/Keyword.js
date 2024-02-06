const mongoose = require("mongoose");

const { Schema } = mongoose;

const keywordSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    unique: true,
  },
  videos: {
    type: [
      {
        videoId: {
          type: Schema.Types.ObjectId,
          ref: "Video",
        },
        youtubeVideoId: {
          type: String,
          required: true,
          unique: true,
        },
        TF: {
          type: Number,
          default: 1,
          required: true,
        },
        score: {
          type: mongoose.Decimal128,
          default: 0,
          required: true,
        },
      },
    ],
    default: [],
    required: true,
  },
});

module.exports = mongoose.model("Keyword", keywordSchema);
