const { stopWords } = require("./textData");

function analyzeText(text) {
  text = text.replace(/(?:https?|ftp):\/\/[\w\S]+/g, ""); // Remove URLs
  text = text.replace(/[^a-zA-Z\s]/g, ""); // Remove symbols, punctuation, number
  text = text.replace(/\s+/g, " "); // Remove extra whitespace
  text = text.toLowerCase(); // Lowercase text

  const tokens = text
    .split(" ")
    .filter((word) => !stopWords.includes(word.toLowerCase()));

  return tokens;
}

module.exports = analyzeText;
