const express = require("express");

const extractCodeController = require("../controllers/extractCode.controller");

const router = express.Router();

router.post("/", extractCodeController.extractCode);

module.exports = router;
