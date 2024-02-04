const express = require("express");

const keywordsController = require("../controllers/keywords.controller");

const router = express.Router();

router.post("/", keywordsController.searchVideos);

module.exports = router;
