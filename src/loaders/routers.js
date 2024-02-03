const indexRouter = require("../routes/index");
const keywordsRouter = require("../routes/keywords");

async function routerLoader(app) {
  app.use("/", indexRouter);
  app.use("/keywords", keywordsRouter);
}

module.exports = routerLoader;
