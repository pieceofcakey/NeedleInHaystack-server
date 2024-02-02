const Keyword = require("../models/Keyword");
const OriginalKeyword = require("../models/OriginalKeyword");
const analyzeText = require("./analyzeText");
const stemWord = require("./stemmer");

async function invertIndex(video) {
  const fullText = `${video.title} ${video.description} ${video.channel} ${video.transcript} ${video.tag}`;
  const tokens = [...new Set(analyzeText(fullText))];

  const originalKeywordsPromises = tokens.map(async (token) => {
    const originalKeyword = await OriginalKeyword.findOne({ text: token });

    if (!originalKeyword) {
      await OriginalKeyword.create({
        text: token,
      });
    }
  });

  await Promise.all(originalKeywordsPromises);

  const words = [...new Set(tokens.map((token) => stemWord(token)))];

  const keywordsPromises = words.map(async (word) => {
    const keyword = await Keyword.findOne({ text: word });

    if (keyword) {
      keyword.videoIds.push(video._id);
      await keyword.save();
    } else {
      await Keyword.create({
        text: word,
        videoIds: [video._id],
      });
    }
  });

  await Promise.all(keywordsPromises);
}

module.exports = invertIndex;
