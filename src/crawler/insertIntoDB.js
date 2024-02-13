const Keyword = require("../models/Keyword");
const OriginalKeyword = require("../models/OriginalKeyword");
const Video = require("../models/Video");
const DocumentLength = require("../models/DocumentLength");

const analyzeText = require("../utils/analyzeText");
const stemWord = require("../utils/stemWord");
const {
  calculateBM25,
  calculateTF,
  calculateIDF,
} = require("../utils/calculateScore");

const {
  TITLE_WEIGHT,
  DESCRIPTION_WEIGHT,
  TRANSCRIPT_WEIGHT,
  TAG_WEIGHT,
} = require("../constants/rankingConstants");

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

async function saveKeywords(
  video,
  words,
  originalWords,
  titleTokens,
  descriptionTokens,
  transcriptTokens,
  tagTokens,
  session,
) {
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
    const titleTermFrequency = calculateTF(titleTokens, word);
    const descriptionTermFrequency = calculateTF(descriptionTokens, word);
    const transcriptTermFrequency = calculateTF(transcriptTokens, word);
    const tagTermFrequency = calculateTF(tagTokens, word);

    if (keyword) {
      const inverseDocumentFrequency = calculateIDF(
        totalVideos,
        keyword.videos,
      );

      keyword.videos.forEach((prevVideo) => {
        prevVideo.score =
          TITLE_WEIGHT *
          calculateBM25(
            inverseDocumentFrequency,
            prevVideo.titleTF,
            titleTokens.length,
            averageDocumentLength.titleLength,
          );
        prevVideo.score +=
          DESCRIPTION_WEIGHT *
          calculateBM25(
            inverseDocumentFrequency,
            prevVideo.descriptionTF,
            descriptionTokens.length,
            averageDocumentLength.descriptionLength,
          );
        prevVideo.score +=
          TRANSCRIPT_WEIGHT *
          calculateBM25(
            inverseDocumentFrequency,
            prevVideo.transcriptTF,
            transcriptTokens.length,
            averageDocumentLength.transcriptLength,
          );
        prevVideo.score +=
          TAG_WEIGHT *
          calculateBM25(
            inverseDocumentFrequency,
            prevVideo.tagTF,
            tagTokens.length,
            averageDocumentLength.tagLength,
          );
      });

      keyword.videos.push({
        videoId: video._id,
        youtubeVideoId: video.youtubeVideoId,
        TF: termFrequency,
        titleTF: titleTermFrequency,
        descriptionTF: descriptionTermFrequency,
        transcriptTF: transcriptTermFrequency,
        tagTF: tagTermFrequency,
        score:
          TITLE_WEIGHT *
            calculateBM25(
              inverseDocumentFrequency,
              titleTermFrequency,
              titleTokens.length,
              averageDocumentLength.titleLength,
            ) +
          DESCRIPTION_WEIGHT *
            calculateBM25(
              inverseDocumentFrequency,
              descriptionTermFrequency,
              descriptionTokens.length,
              averageDocumentLength.descriptionLength,
            ) +
          TRANSCRIPT_WEIGHT *
            (calculateBM25(
              inverseDocumentFrequency,
              transcriptTermFrequency,
              transcriptTokens.length,
              averageDocumentLength.transcriptLength,
            ) || 0) +
          TAG_WEIGHT *
            (calculateBM25(
              inverseDocumentFrequency,
              tagTermFrequency,
              tagTokens.length,
              averageDocumentLength.tagLength,
            ) || 0),
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
                titleTF: titleTermFrequency,
                descriptionTF: descriptionTermFrequency,
                transcriptTF: transcriptTermFrequency,
                tagTF: tagTermFrequency,
                score:
                  TITLE_WEIGHT *
                    calculateBM25(
                      inverseDocumentFrequency,
                      titleTermFrequency,
                      titleTokens.length,
                      averageDocumentLength.titleLength,
                    ) +
                  DESCRIPTION_WEIGHT *
                    calculateBM25(
                      inverseDocumentFrequency,
                      descriptionTermFrequency,
                      descriptionTokens.length,
                      averageDocumentLength.descriptionLength,
                    ) +
                  TRANSCRIPT_WEIGHT *
                    (calculateBM25(
                      inverseDocumentFrequency,
                      transcriptTermFrequency,
                      transcriptTokens.length,
                      averageDocumentLength.transcriptLength,
                    ) || 0) +
                  TAG_WEIGHT *
                    (calculateBM25(
                      inverseDocumentFrequency,
                      tagTermFrequency,
                      tagTokens.length,
                      averageDocumentLength.tagLength,
                    ) || 0),
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

  await saveAverageDocumentLength(video, session);
  await saveOriginalKeywords(tokens, session);
  await saveKeywords(
    video,
    words,
    originalWords,
    titleTokens,
    descriptionTokens,
    transcriptTokens,
    tagTokens,
    session,
  );
}

module.exports = insertIntoDB;
