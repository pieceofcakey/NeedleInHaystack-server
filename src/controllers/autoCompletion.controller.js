const jwt = require("jsonwebtoken");
const Query = require("../models/Query");
const User = require("../models/User");

exports.getAutoCompletions = async function (req, res, next) {
  const { accessToken } = req.cookies;
  const MAXIMUM_AUTO_COMPLETIONS = 5;

  let userData;

  if (accessToken) {
    userData = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
  }

  const searchHistories = [];
  const { userInput } = req.query;
  const userId = userData?.userId;

  if (userId) {
    const user = await User.findOne({ _id: userId }).lean();
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

  if (!userInput) {
    res.status(200).send({
      result: "ok",
      searchHistories: [],
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
