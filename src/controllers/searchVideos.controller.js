const fetchVideosRanks = require("../utils/fetchVideosRanks");
const Query = require("../models/Query");
const checkUserInputSpelling = require("../utils/checkSpelling");

exports.searchVideos = async function (req, res, next) {
  const { userInput, pageParam, shouldCheckSpell } = req.body;
  const userQuery = userInput.join(" ");

  if (!userQuery.trim()) {
    res.status(200).send({ result: "null", videos: [], query: userQuery });
    return;
  }

  try {
    const recommendedSearchKeyword = await checkUserInputSpelling(userQuery);
    const correctedInput = shouldCheckSpell
      ? recommendedSearchKeyword
      : userQuery;

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

    if (ranks.length === 0) {
      res.status(200).send({
        result: "null",
        videos: [],
        query: userQuery,
        recommendedSearchKeyword,
      });

      return;
    }

    const totalPages = Math.floor(ranks.length / 10);

    res.status(200).send({
      result: "ok",
      videos: ranks.slice(10 * pageParam, 10 * pageParam + 10),
      query: userQuery,
      nextPage: pageParam < totalPages ? pageParam + 1 : null,
      correctedInput,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      result: "ng",
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};
