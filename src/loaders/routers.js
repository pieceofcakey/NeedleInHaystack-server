const indexRouter = require("../routes/index");
const keywordsRouter = require("../routes/keywords");
const autoCompletionsRouter = require("../routes/autoCompletions");
const videosRouter = require("../routes/videos");

async function routerLoader(app) {
  app.use("/", indexRouter);
  app.use("/keywords", keywordsRouter);
  app.use("/auto-completions", autoCompletionsRouter);
  app.use("/videos", videosRouter);
}

module.exports = routerLoader;
