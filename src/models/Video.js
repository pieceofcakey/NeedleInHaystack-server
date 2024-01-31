const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
  youtubeVideoId: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  transcript: {
    type: String,
    required: true,
  },
  thumbnailURL: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    required: true,
  },
});

videoSchema.pre("validate", function (next) {
  this.transcript = this.transcript || " ";
  this.tag = this.tag || " ";
  next();
});

module.exports = mongoose.model("Video", videoSchema);
