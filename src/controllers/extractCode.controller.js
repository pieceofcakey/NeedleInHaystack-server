const axios = require("axios");

exports.extractCode = async function (req, res, next) {
  const response = await axios.post(
    `${process.env.AWS_LAMBDA_EXTRACT_CODE}`,
    req.body,
  );

  res.status(200).send({ extractedCode: response.data.extractedCode });
};
