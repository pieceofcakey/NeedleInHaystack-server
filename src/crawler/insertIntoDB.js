const Keyword = require("../models/Keyword");
const OriginalKeyword = require("../models/OriginalKeyword");
const Video = require("../models/Video");
const DocumentLength = require("../models/DocumentLength");

const analyzeText = require("../utils/analyzeText");
const stemWord = require("../utils/stemWord");
const {
  calculateTF,
  calculateIDF,
  calculateBM25F,
} = require("../utils/calculateScore");

async function saveAverageDocumentLength(video, session) {
  const totalVideos = (await Video.estimatedDocumentCount()) || 1;

  const averageDocumentLength = await DocumentLength.findOne({
    name: "averageDocumentLength",
  }).session(session);

  if (averageDocumentLength) {
    averageDocumentLength.documentLength = Math.floor(
      (averageDocumentLength.documentLength * (totalVideos - 1) +
        video.documentLength) /
        totalVideos,
    );

    averageDocumentLength.titleLength = Math.floor(
      (averageDocumentLength.titleLength * (totalVideos - 1) +
        video.titleLength) /
        totalVideos,
    );

    averageDocumentLength.descriptionLength = Math.floor(
      (averageDocumentLength.descriptionLength * (totalVideos - 1) +
        video.descriptionLength) /
        totalVideos,
    );

    averageDocumentLength.transcriptLength = Math.floor(
      (averageDocumentLength.transcriptLength * (totalVideos - 1) +
        video.transcriptLength) /
        totalVideos,
    );

    averageDocumentLength.tagLength = Math.floor(
      (averageDocumentLength.tagLength * (totalVideos - 1) + video.tagLength) /
        totalVideos,
    );

    await averageDocumentLength.save();
  } else {
    await DocumentLength.create(
      [
        {
          name: "averageDocumentLength",
          documentLength: video.documentLength,
          titleLength: video.titleLength,
          descriptionLength: video.descriptionLength,
          transcriptLength: video.transcriptLength,
          tagLength: video.tagLength,
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

async function saveKeywords(video, words, originalWords, fieldTokens, session) {
  const totalVideos = (await Video.estimatedDocumentCount()) || 1;

  const averageDocumentLength = (await DocumentLength.findOne({
    name: "averageDocumentLength",
  }).lean()) || {
    documentLength: video.documentLength,
    titleLength: video.titleLength,
    descriptionLength: video.descriptionLength,
    transcriptLength: video.transcriptLength,
    tagLength: video.tagLength,
  };

  const keywordsPromises = words.map(async (word) => {
    const keyword = await Keyword.findOne({ text: word }).session(session);

    const termFrequency = calculateTF(originalWords, word);

    const TFs = {
      titleTF: calculateTF(fieldTokens.titleTokens, word),
      descriptionTF: calculateTF(fieldTokens.descriptionTokens, word),
      transcriptTF: calculateTF(fieldTokens.descriptionTokens, word),
      tagTermTF: calculateTF(fieldTokens.transcriptTokens, word),
    };

    if (keyword) {
      const inverseDocumentFrequency = calculateIDF(
        totalVideos,
        keyword.videos,
      );

      keyword.videos.forEach((prevVideo) => {
        prevVideo.score = calculateBM25F(
          inverseDocumentFrequency,
          prevVideo,
          fieldTokens,
          averageDocumentLength,
        );
      });

      keyword.videos.push({
        videoId: video._id,
        youtubeVideoId: video.youtubeVideoId,
        TF: termFrequency,
        titleTF: TFs.titleTF,
        descriptionTF: TFs.descriptionTF,
        transcriptTF: TFs.transcriptTF,
        tagTF: TFs.tagTF,
        score: calculateBM25F(
          inverseDocumentFrequency,
          TFs,
          fieldTokens,
          averageDocumentLength,
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
                titleTF: TFs.titleTF,
                descriptionTF: TFs.descriptionTF,
                transcriptTF: TFs.transcriptTF,
                tagTF: TFs.tagTF,
                score: calculateBM25F(
                  inverseDocumentFrequency,
                  TFs,
                  fieldTokens,
                  averageDocumentLength,
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

  const titleTokens = analyzeText(`${video.title} ${video.channel}`).map(
    (token) => stemWord(token),
  );
  const descriptionTokens = analyzeText(video.description).map((token) =>
    stemWord(token),
  );
  const transcriptTokens = analyzeText(video.transcript).map((token) =>
    stemWord(token),
  );
  const tagTokens = analyzeText(video.tag).map((token) => stemWord(token));

  const fieldTokens = {
    titleTokens,
    descriptionTokens,
    transcriptTokens,
    tagTokens,
  };

  await saveAverageDocumentLength(video, session);
  await saveOriginalKeywords(tokens, session);
  await saveKeywords(video, words, originalWords, fieldTokens, session);
}

module.exports = insertIntoDB;
