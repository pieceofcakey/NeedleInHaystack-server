const analyzeText = require("./analyzeText");
const stemWord = require("./stemWord");

const Keyword = require("../models/Keyword");

async function fetchVideosRanks(query) {
  const results = {};

  const tokens = [...new Set(analyzeText(query))];
  const keywords = [...new Set(tokens.map((token) => stemWord(token)))];

  const firstKeyword = keywords.shift();
  const firstKeywordData = await Keyword.findOne({ text: firstKeyword });

  firstKeywordData.videos.forEach((video) => {
    results[video.youtubeVideoId] = parseFloat(video.score);
  });

  const keywordsPromises = keywords.map(async (keyword) => {
    const keywordData = await Keyword.findOne({ text: keyword });

    keywordData.videos.forEach((video) => {
      if (results[video.youtubeVideoId]) {
        results[video.youtubeVideoId] += parseFloat(video.score);
      }
    });
  });

  await Promise.allSettled(keywordsPromises);

  const ranks = Object.keys(results).map((key) => [key, results[key]]);

  return ranks;
}

module.exports = fetchVideosRanks;
