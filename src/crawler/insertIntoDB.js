const Keyword = require("../models/Keyword");
const OriginalKeyword = require("../models/OriginalKeyword");
const Video = require("../models/Video");
const DocumentData = require("../models/DocumentData");

const analyzeText = require("../utils/analyzeText");
const stemWord = require("../utils/stemWord");
const { K1, B } = require("../constants/crawlerConstants");

async function saveAverageDocumentLength(video) {
  const totalVideos = await Video.estimatedDocumentCount().lean();
  const averageDocumentLength = await DocumentData.findOne({
    name: "averageDocumentLength",
  });

  if (averageDocumentLength) {
    averageDocumentLength.value = Math.floor(
      (averageDocumentLength.value * (totalVideos - 1) + video.documentLength) /
        totalVideos,
    );

    await averageDocumentLength.save();
  } else {
    await DocumentData.create({
      name: "averageDocumentLength",
      value: video.documentLength,
    });
  }
}

async function saveOriginalKeywords(video, tokens) {
  const originalKeywordsPromises = tokens.map(async (token) => {
    const originalKeyword = await OriginalKeyword.findOne({
      text: token,
    }).lean();

    if (!originalKeyword) {
      await OriginalKeyword.create({
        text: token,
      });
    }
  });

  await Promise.allSettled(originalKeywordsPromises);
}

async function saveKeywords(video, words, originalWords) {
  const totalVideos = await Video.estimatedDocumentCount().lean();
  const averageDocumentLength = await DocumentData.findOne({
    name: "averageDocumentLength",
  }).lean();
  const keywordsPromises = words.map(async (word) => {
    const keyword = await Keyword.findOne({ text: word });

    const termFrequency = originalWords.filter(
      (originalWord) => originalWord === word,
    ).length;

    if (keyword) {
      const inverseDocumentFrequency = Math.log(
        (totalVideos - keyword.videos.length + 0.5) /
          (keyword.videos.length + 0.5) +
          1,
      );

      keyword.videos.forEach((prevVideo) => {
        const numerator = prevVideo.TF * (K1 + 1);
        const denominator =
          prevVideo.TF +
          K1 *
            (1 - B + (B * originalWords.length) / averageDocumentLength.value);

        prevVideo.score = (inverseDocumentFrequency * numerator) / denominator;
      });

      const numerator = termFrequency * (K1 + 1);
      const denominator =
        termFrequency +
        K1 * (1 - B + (B * originalWords.length) / averageDocumentLength.value);

      keyword.videos.push({
        videoId: video._id,
        youtubeVideoId: video.youtubeVideoId,
        TF: termFrequency,
        score: (inverseDocumentFrequency * numerator) / denominator,
      });

      keyword.videos = keyword.videos.sort((a, b) => b.score - a.score);

      await keyword.save();
    } else {
      const inverseDocumentFrequency = Math.log(
        (totalVideos - 1 + 0.5) / (1 + 0.5) + 1,
      );

      await Keyword.create({
        text: word,
        videos: [
          {
            videoId: video._id,
            youtubeVideoId: video.youtubeVideoId,
            TF: termFrequency,
            score:
              (inverseDocumentFrequency * (termFrequency * (K1 + 1))) /
              (termFrequency +
                K1 *
                  (1 - B + (B * words.length) / averageDocumentLength.value)),
          },
        ],
      });
    }
  });

  await Promise.allSettled(keywordsPromises);
}

async function insertDB(newVideoObject) {
  const video = await Video.create(newVideoObject);
  const fullText = `${video.title} ${video.description} ${video.channel} ${video.transcript} ${video.tag}`;
  const originalTokens = analyzeText(fullText);
  const originalWords = originalTokens.map((token) => stemWord(token));
  const tokens = [...new Set(originalTokens)];
  const words = [...new Set(tokens.map((token) => stemWord(token)))];

  await saveAverageDocumentLength(video);
  await saveOriginalKeywords(video, tokens);
  await saveKeywords(video, words, originalWords);
}

module.exports = insertDB;
