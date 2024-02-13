const express = require("express");

const autoCompletionsController = require("../controllers/autoCompletion.controller");

const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

router.get("/", verifyToken, autoCompletionsController.getAutoCompletions);

module.exports = router;
