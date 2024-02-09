const express = require("express");
const verifyToken = require("../middlewares/verifyToken");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

router.get("/", verifyToken, async function (req, res, next) {
  const refreshToken = req.cookies.refreshToken;
  const userData = jwt.verify(refreshToken, process.env.JWT_SECRET_KEY);
  const user = await User.findById(userData.userId);

  res.status(200).send({ result: "ok", user });
});

module.exports = router;
