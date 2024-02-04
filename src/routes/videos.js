const express = require("express");

const videoController = require("../controllers/keywords.controller");

const router = express.Router();

router.post("/", videoController.searchVideos);

module.exports = router;
