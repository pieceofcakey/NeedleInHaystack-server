const fetchVideosRanks = require("../utils/fetchVideosRanks");
const checkUserInputSpelling = require("../utils/checkSpelling");
const Query = require("../models/Query");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.searchVideos = async function (req, res, next) {
  const { userInput, pageParam, shouldCheckSpell } = req.body;
  const userQuery = userInput.join(" ");
  const accessToken = req.cookies.accessToken;

  let userData;

  try {
    userData = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
  } catch (error) {
    console.error(error);
  }

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

    let user;

    if (userData) {
      user = await User.findOne({ _id: userData.userId });
    }

    if (query) {
      query.count += 1;

      await query.save();

      if (user) {
        const indexToRemove = user.searchHistory.indexOf(correctedInput);

        if (indexToRemove !== -1) {
          user.searchHistory.splice(indexToRemove, 1);
        }

        user.searchHistory.push(correctedInput);

        await user.save();
      }
    } else {
      await Query.create({
        text: userQuery,
        count: 1,
      });

      if (user) {
        user.searchHistory.push(query);

        await user.save();
      }
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
    console.error(error);
    res.status(500).json({
      result: "ng",
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};
