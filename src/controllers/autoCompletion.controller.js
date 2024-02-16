const jwt = require("jsonwebtoken");
const Query = require("../models/Query");
const User = require("../models/User");

exports.getAutoCompletions = async function (req, res, next) {
  const { accessToken } = req.cookies;
  const { userInput } = req.query;
  const MAXIMUM_AUTO_COMPLETIONS = 5;
  const searchHistories = [];

  let userData;
  let user;

  if (accessToken) {
    userData = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
    user = userData.userId;
  }

  if (user) {
    const foundUser = await User.findById(user).lean();
    const userSearchHistory = foundUser.searchHistory;

    if (userInput) {
      const matchingItems = userSearchHistory.filter((item) => {
        const regex = new RegExp(`^${userInput}`, "i");

        return regex.test(item);
      });

      return res.status(200).send({
        result: "ok",
        searchHistories: matchingItems.slice(0, MAXIMUM_AUTO_COMPLETIONS),
      });
    }

    return res.status(200).send({
      result: "ok",
      searchHistories: userSearchHistory
        .reverse()
        .slice(0, MAXIMUM_AUTO_COMPLETIONS),
    });
  }

  if (!userInput) {
    return res.status(200).send({
      result: "ok",
      searchHistories: [],
    });
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

    return res.status(200).send({
      result: "ok",
      searchHistories,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};
