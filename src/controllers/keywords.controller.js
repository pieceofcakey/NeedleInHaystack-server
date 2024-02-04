const calculateRank = require("../utils/calculateRank");
const Query = require("../models/Query");

exports.searchVideos = async function (req, res, next) {
  const { userInput } = req.body;
  const userQuery = userInput.join(" ");

  try {
    const ranks = await calculateRank(userQuery);
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

    res.status(200).send(ranks);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};
