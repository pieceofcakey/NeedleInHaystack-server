const calculateRank = require("../utils/calculateRank");

exports.searchVideos = async function (req, res, next) {
  const { userInput, shouldSpellCheck } = req.query;

  try {
    const ranks = await calculateRank(userInput);

    res.status(200).send(ranks);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};
