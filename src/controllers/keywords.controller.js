const fetchVideosRanks = require("../utils/fetchVideosRanks");
const Query = require("../models/Query");
const checkSpelling = require("../utils/checkSpelling");

exports.searchVideos = async function (req, res, next) {
  const { userInput } = req.body;
  const userQuery = userInput.join(" ");

  const correctedInput = await checkSpelling(userQuery);

  try {
    const ranks = await fetchVideosRanks(correctedInput);
    const query = await Query.findOne({ text: userQuery });

    if (query) {
      query.count += 1;
      await query.save();
    } else {
      await Query.create({
        text: userQuery,
        count: 1,
      });
    }

    res.status(200).send({ result: "ok", videos: ranks, query: userQuery });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      result: "ng",
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};
