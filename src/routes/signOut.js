const express = require("express");

const signOutController = require("../controllers/signOut.controller");

const router = express.Router();

router.get("/", signOutController.signOut);

module.exports = router;
