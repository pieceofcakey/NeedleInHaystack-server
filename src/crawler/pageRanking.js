const { DAMPING_FACTOR, ITERATIONS } = require("../constants/rankingConstants");

const Video = require("../models/Video");

async function setBackLinks() {
  try {
    const videos = await Video.find();

    const videosPromises = videos.map(async (video) => {
      const forwardLinks = [];

      await Promise.all(
        video.allForwardLinks.map(async (forwardLink) => {
          const forwardVideo = await Video.findOne({
            youtubeVideoId: forwardLink,
          });

          if (
            forwardVideo &&
            forwardVideo.youtubeVideoId !== video.youtubeVideoId &&
            !forwardVideo.backLinks.includes(video.youtubeVideoId)
          ) {
            forwardVideo.backLinks.push(video.youtubeVideoId);

            await forwardVideo.save();
          }

          if (
            forwardVideo &&
            forwardVideo.youtubeVideoId !== video.youtubeVideoId
          ) {
            forwardLinks.push(forwardLink);
          }
        }),
      );

      await Video.findOneAndUpdate(
        { youtubeVideoId: video.youtubeVideoId },
        { forwardLinks },
      );
    });

    await Promise.all(videosPromises);
  } catch (error) {
    console.error(error);
  }
}

async function calculatePageRank(dampingFactor, iterations) {
  try {
    const pageRank = {};
    const videos = await Video.find().lean();
    const totalVideos = await Video.estimatedDocumentCount().lean();

    videos.forEach((video) => {
      pageRank[video.youtubeVideoId] = 1 / totalVideos;
    });

    for (let i = 0; i < iterations; i += 1) {
      await Promise.allSettled(
        videos.map(async (video) => {
          let newRank = 0;
          const targetYoutubeVideoId = video.youtubeVideoId;

          const newRankPromises = video.backLinks.map(
            async (youtubeVideoId) => {
              const targetVideo = await Video.findOne({
                youtubeVideoId,
              }).lean();

              newRank +=
                pageRank[youtubeVideoId] /
                (targetVideo.forwardLinks.length || totalVideos);
            },
          );

          await Promise.all(newRankPromises);

          newRank = (1 - dampingFactor) / totalVideos + dampingFactor * newRank;

          pageRank[targetYoutubeVideoId] = newRank;
        }),
      );
    }

    await Promise.all(
      Object.keys(pageRank).map(async (youtubeVideoId) => {
        const video = await Video.findOne({ youtubeVideoId });

        video.pageRankScore = pageRank[youtubeVideoId];

        await video.save();
      }),
    );
  } catch (error) {
    console.error(error);
  }
}

async function pageRanking() {
  console.log("Start calculating page rank");

  try {
    await setBackLinks();
    await calculatePageRank(DAMPING_FACTOR, ITERATIONS);
    console.log("Finish calculating page rank");
  } catch (error) {
    console.error(error.message);
  }
}

module.exports = { pageRanking };
