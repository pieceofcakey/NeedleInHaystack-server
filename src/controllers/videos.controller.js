const Video = require("../models/Video");

exports.fetchVideo = async function (req, res, next) {
  const youtubeVideoId = req.params.video_id;

  try {
    const video = await Video.findOne({ youtubeVideoId });

    res.status(200).send({ result: "ok", video });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      result: "ng",
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};
