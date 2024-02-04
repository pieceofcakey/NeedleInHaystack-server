const express = require("express");

const videosController = require("../controllers/videos.controller");

const router = express.Router();

router.get("/:video_id", videosController.fetchVideo);

module.exports = router;
