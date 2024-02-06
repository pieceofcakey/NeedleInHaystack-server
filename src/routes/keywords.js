const express = require("express");

const searchVideosController = require("../controllers/searchVideos.controller");

const router = express.Router();

router.post("/", searchVideosController.searchVideos);

module.exports = router;
