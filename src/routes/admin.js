const express = require("express");

const crawlingController = require("../controllers/crawling.controller");

const router = express.Router();

router.get("/streamCrawling", crawlingController.streamCrawling);
router.get("/startCrawling", crawlingController.startCrawling);
router.get("/stopCrawling", crawlingController.stopCrawling);

module.exports = router;
