const Query = require("../models/Query");

exports.getAutoCompletions = async function (req, res, next) {
  const searchHistories = [];
  const { userInput } = req.query;
  const MAXIMUM_AUTO_COMPLETIONS = 5;

  if (!userInput) {
    return res.status(200).send([]);
  }

  try {
    const matchingHistories = await Query.find(
      { text: { $regex: `^${userInput}`, $options: "i" } },
      {},
    )
      .lean()
      .sort({ count: -1 });

    matchingHistories
      .slice(0, MAXIMUM_AUTO_COMPLETIONS)
      .forEach((element) => searchHistories.push(element.text));

    res.status(200).send(searchHistories);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};
