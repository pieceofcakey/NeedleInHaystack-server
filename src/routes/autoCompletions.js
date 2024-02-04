const express = require("express");

const autoCompletionsController = require("../controllers/autoCompletion.controller");

const router = express.Router();

router.get("/", autoCompletionsController.getAutoCompletions);

module.exports = router;
