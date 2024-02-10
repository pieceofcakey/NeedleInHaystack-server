const indexRouter = require("../routes/index");
const keywordsRouter = require("../routes/keywords");
const autoCompletionsRouter = require("../routes/autoCompletions");
const videosRouter = require("../routes/videos");
const signInRouter = require("../routes/signIn");
const signOutRouter = require("../routes/signOut");
const adminRouter = require("../routes/admin");

async function routerLoader(app) {
  app.use("/", indexRouter);
  app.use("/keywords", keywordsRouter);
  app.use("/auto-completions", autoCompletionsRouter);
  app.use("/videos", videosRouter);
  app.use("/signIn", signInRouter);
  app.use("/signOut", signOutRouter);
  app.use("/admin", adminRouter);
}

module.exports = routerLoader;
