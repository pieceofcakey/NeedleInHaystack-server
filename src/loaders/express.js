const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

async function expressLoader(app) {
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
}

module.exports = expressLoader;
