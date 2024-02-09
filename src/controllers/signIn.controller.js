const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");

exports.signIn = async function (req, res, next) {
  const email = req.body.email;
  const photoURL = req.body.photoURL;
  const displayName = req.body.displayName;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        photoURL,
        displayName,
        isAdmin: false,
      });
    }

    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
    });

    res.send({ result: "ok", message: "login successful!", user });
  } catch (error) {
    console.log(error);
  }
};
