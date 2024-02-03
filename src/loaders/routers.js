const indexRouter = require("../routes/index");
const autoCompletionsRouter = require("../routes/autoCompletions");

async function routerLoader(app) {
  app.use("/", indexRouter);
  app.use("/auto-completions", autoCompletionsRouter);
}

module.exports = routerLoader;
