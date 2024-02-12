const Keyword = require("../models/Keyword");
const OriginalKeyword = require("../models/OriginalKeyword");
const Video = require("../models/Video");
const DocumentData = require("../models/DocumentData");

const analyzeText = require("../utils/analyzeText");
const stemWord = require("../utils/stemWord");
const {
  calculateBM25,
  calculateTF,
  calculateIDF,
} = require("../utils/calculateScore");

async function saveAverageDocumentLength(video, session) {
  const totalVideos = await Video.estimatedDocumentCount().lean();
  const averageDocumentLength = await DocumentData.findOne({
    name: "averageDocumentLength",
  }).session(session);

  if (averageDocumentLength) {
    averageDocumentLength.value = Math.floor(
      (averageDocumentLength.value * (totalVideos - 1) + video.documentLength) /
        totalVideos,
    );

    await averageDocumentLength.save();
  } else {
    await DocumentData.create(
      [
        {
          name: "averageDocumentLength",
          value: video.documentLength,
        },
      ],
      { session },
    );
  }
}

async function saveOriginalKeywords(tokens, session) {
  const originalKeyword = await OriginalKeyword.findOne({
    name: "originalKeywords",
  }).session(session);

  if (originalKeyword) {
    tokens.forEach((token) => originalKeyword.value.push(token));

    originalKeyword.value = [...new Set(originalKeyword.value)];
    await originalKeyword.save();
  } else {
    await OriginalKeyword.create(
      [{ name: "originalKeywords", value: tokens }],
      { session },
    );
  }
}

async function saveKeywords(video, words, originalWords, session) {
  const totalVideos = await Video.estimatedDocumentCount().lean();
  const averageDocumentLength =
    (await DocumentData.findOne({
      name: "averageDocumentLength",
    }).lean()) || video.documentLength;

  const keywordsPromises = words.map(async (word) => {
    const keyword = await Keyword.findOne({ text: word }).session(session);

    const termFrequency = calculateTF(originalWords, word);

    if (keyword) {
      const inverseDocumentFrequency = calculateIDF(
        totalVideos,
        keyword.videos,
      );

      keyword.videos.forEach((prevVideo) => {
        prevVideo.score = calculateBM25(
          inverseDocumentFrequency,
          prevVideo.TF,
          originalWords.length,
          averageDocumentLength.value,
        );
      });

      keyword.videos.push({
        videoId: video._id,
        youtubeVideoId: video.youtubeVideoId,
        TF: termFrequency,
        score: calculateBM25(
          inverseDocumentFrequency,
          termFrequency,
          originalWords.length,
          averageDocumentLength.value,
        ),
      });

      keyword.videos = keyword.videos.sort((a, b) => b.score - a.score);
      keyword.IDF = inverseDocumentFrequency;

      await keyword.save();
    } else {
      const inverseDocumentFrequency = Math.log(
        (totalVideos - 1 + 0.5) / (1 + 0.5) + 1,
      );

      await Keyword.create(
        [
          {
            text: word,
            videos: [
              {
                videoId: video._id,
                youtubeVideoId: video.youtubeVideoId,
                TF: termFrequency,
                score: calculateBM25(
                  inverseDocumentFrequency,
                  termFrequency,
                  originalWords.length,
                  averageDocumentLength.value,
                ),
              },
            ],
            IDF: inverseDocumentFrequency,
          },
        ],
        { session },
      );
    }
  });

  await Promise.all(keywordsPromises);
}

async function insertIntoDB(newVideoObject, session) {
  const videoData = await Video.create([newVideoObject], { session });
  const video = videoData[0];
  const fullText = `${video.title} ${video.description} ${video.channel} ${video.transcript} ${video.tag}`;
  const originalTokens = analyzeText(fullText);
  const originalWords = originalTokens.map((token) => stemWord(token));
  const tokens = [...new Set(originalTokens)];
  const words = [...new Set(tokens.map((token) => stemWord(token)))];

  await saveAverageDocumentLength(video, session);
  await saveOriginalKeywords(tokens, session);
  await saveKeywords(video, words, originalWords, session);
}

module.exports = insertIntoDB;
