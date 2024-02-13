const jwt = require("jsonwebtoken");
const Query = require("../models/Query");
const User = require("../models/User");

const MAXIMUM_AUTO_COMPLETIONS = 10;

exports.getAutoCompletions = async function (req, res, next) {
  const { userInput } = req.query;

  if (!userInput) {
    res.status(200).send({
      result: "ok",
      searchHistories: [],
    });

    return;
  }

  const searchHistories = [];

  if (req.user) {
    const user = await User.findById(req.user).lean();
    const userSearchHistory = user.searchHistory;

    if (userInput) {
      const matchingItems = userSearchHistory.filter((item) => {
        const regex = new RegExp(`^${userInput}`, "i");
        return regex.test(item);
      });

      res.status(200).send({
        result: "ok",
        searchHistories: matchingItems,
      });

      return;
    }

    res.status(200).send({
      result: "ok",
      searchHistories: userSearchHistory.reverse(),
    });

    return;
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

    res.status(200).send({
      result: "ok",
      searchHistories,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};
