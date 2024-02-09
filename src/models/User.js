const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  photoURL: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  searchHistory: {
    type: [String],
    unique: true,
  },
  role: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("User", userSchema);
