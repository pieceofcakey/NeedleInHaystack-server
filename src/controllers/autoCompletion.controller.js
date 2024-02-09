const Query = require("../models/Query");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.getAutoCompletions = async function (req, res, next) {
  const accessToken = req.cookies.accessToken;
  const MAXIMUM_AUTO_COMPLETIONS = 5;

  let userData;

  if (accessToken) {
    userData = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
  }

  const searchHistories = [];
  const { userInput } = req.query;
  const user = userData?.userId;

  if (user) {
    const foundUser = await User.findOne({ _id: user }).lean();
    const userSearchHistory = foundUser.searchHistory;

    if (userInput) {
      const matchingItems = userSearchHistory.filter((item) => {
        regex = new RegExp(`^${userInput}`, "i");
        return regex.test(item);
      });

      return res.status(200).send({
        result: "ok",
        searchHistories: matchingItems,
      });
    }

    return res.status(200).send({
      result: "ok",
      searchHistories: userSearchHistory.reverse(),
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
