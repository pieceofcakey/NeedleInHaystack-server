const express = require("express");

const signInController = require("../controllers/signIn.controller");

const router = express.Router();

router.post("/", signInController.signIn);

module.exports = router;
