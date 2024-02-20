const Keyword = require("../models/Keyword");
const Video = require("../models/Video");

async function combineScores() {
  console.log("Start Ranking for all keywords");

  const keywords = await Keyword.find().populate("videos.videoId");

  try {
    await Promise.all(
      keywords.map(async (keyword) => {
        keyword.videos.forEach((video) => {
          video.score =
            parseFloat(video.scoreBM, 10) *
            (1 + parseFloat(video.videoId.pageRankScore, 10));
        });

        keyword.videos = keyword.videos.sort(
          (videoOne, videoTwo) => videoTwo.score - videoOne.score,
        );

        await keyword.save();
      }),
    );
  } catch (error) {
    console.error(error);
  }

  console.log("Finish Ranking for all keywords");
}

module.exports = { combineScores };
