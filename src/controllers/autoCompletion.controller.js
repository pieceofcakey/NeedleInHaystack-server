const Query = require("../models/Query");

exports.getAutoCompletions = async function (req, res, next) {
  const histories = [];
  const userInput = req.query.keywords;

  try {
    const matchingHistories = await Query.find(
      { text: { $regex: `^${userInput}`, $options: "i" } },
      {},
    ).sort({ count: -1 });

    matchingHistories
      .slice(0, 5)
      .forEach((element) => histories.push(element.text));

    res.status(200).send(histories);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};
