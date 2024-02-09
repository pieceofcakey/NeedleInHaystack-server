exports.signOut = async function (req, res, next) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.send({ result: "ok", message: "logout successful" });
};
