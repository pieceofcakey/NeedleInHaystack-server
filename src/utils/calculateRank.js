const analyzeText = require("./analyzeText");
const stemWord = require("./stemWord");

const Keyword = require("../models/Keyword");
const Video = require("../models/Video");

const K1 = 1.2;
const B = 0.75;

async function getAverageDocumentLength() {
  const videos = await Video.find({});
  let averageDocumentLength = 0;

  videos.forEach((video) => {
    const fullText = `${video.title} ${video.description} ${video.channel} ${video.transcript} ${video.tag}`;
    const tokens = [...new Set(analyzeText(fullText))];
    const words = [...new Set(tokens.map((token) => stemWord(token)))];

    averageDocumentLength += words.length;
  });

  return averageDocumentLength;
}

async function calculateRank(query) {
  const scores = {};
  const averageDocumentLength = await getAverageDocumentLength();

  const tokens = [...new Set(analyzeText(query))];
  const keywords = [...new Set(tokens.map((token) => stemWord(token)))];

  const totalVideos = await Video.estimatedDocumentCount();

  const rankings = keywords.map(async (keyword) => {
    const keywordData = await Keyword.findOne({ text: keyword }).populate(
      "videoIds",
    );

    if (keywordData) {
      const videos = keywordData.videoIds;
      const inverseDocumentFrequency = Math.log(
        (totalVideos - videos.length + 0.5) / (videos.length + 0.5),
      );

      videos.forEach((video) => {
        const fullText =
          video.title +
          video.description +
          video.channel +
          video.transcript +
          video.tag;

        const videoTokens = analyzeText(fullText);
        const videoKeywords = videoTokens.map((videoToken) =>
          stemWord(videoToken),
        );

        const termFrequency = videoKeywords.find(
          (videoKeyword) => videoKeyword === keyword,
        ).length;
        const numerator = termFrequency * (K1 + 1);
        const denominator =
          termFrequency +
          K1 * (1 - B + B * (videoKeywords.length / averageDocumentLength));
        scores[video._id] =
          (scores[video._id] || 0) +
          inverseDocumentFrequency * (numerator / denominator);
      });
    }
  });

  await Promise.all(rankings);

  const ranks = Object.keys(scores)
    .map((key) => [key, scores[key]])
    .sort((a, b) => b[1] - a[1]);

  return ranks;
}

module.exports = calculateRank;
