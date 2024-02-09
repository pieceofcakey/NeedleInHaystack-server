const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const {
  TWO_WEEKS_IN_MILLISECONDS,
  ONE_HOUR_IN_MILLISECONDS,
} = require("../constants/jwtConstants");

async function verifyToken(req, res, next) {
  const accessToken = req.cookies.accessToken;
  const refreshToken = req.cookies.refreshToken;
  let userData;

  if (!accessToken && !refreshToken) {
    return res
      .status(203)
      .send({ result: false, message: "you should login.." });
  }

  try {
    userData = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
  } catch (error) {
    try {
      userData = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
    } catch (error) {
      return res
        .status(203)
        .send({ result: false, message: "you should login.." });
    }

    const user = await User.findById(userData.userId);
    const accessToken = generateAccessToken(user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: ONE_HOUR_IN_MILLISECONDS,
    });

    next();
  }

  try {
    jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
  } catch (error) {
    const user = await User.findById(userData.userId);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: TWO_WEEKS_IN_MILLISECONDS,
    });

    next();
  }

  next();
}

module.exports = verifyToken;
