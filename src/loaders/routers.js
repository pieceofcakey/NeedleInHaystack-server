const indexRouter = require("../routes/index");
const keywordsRouter = require("../routes/keywords");
const autoCompletionsRouter = require("../routes/autoCompletions");

async function routerLoader(app) {
  app.use("/", indexRouter);
  app.use("/keywords", keywordsRouter);
  app.use("/auto-completions", autoCompletionsRouter);
}

module.exports = routerLoader;
