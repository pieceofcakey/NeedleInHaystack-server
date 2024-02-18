const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { crawl } = require("../crawler/crawl");

let clients = [];
let linksQueue = [];
let shouldStopCrawling;
let crawlURL;

exports.streamCrawling = async function (req, res) {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  res.writeHead(200, headers);

  clients = [];
  linksQueue = [];

  const clientId = uuidv4();
  const newClient = {
    id: clientId,
    res,
  };

  clients.push(newClient);

  console.log(`${clientId} - Connection opened`);

  req.on("close", () => {
    console.log(`${clientId} - Connection closed`);
    clients = clients.filter((client) => client.id !== clientId);
  });
};

exports.startCrawling = async function (req, res, next) {
  const { entryURL } = req.query;
  const maxCrawlPages = req.query.maxCrawlPages || 1;

  try {
    shouldStopCrawling = false;
    linksQueue = [];
    let crawledPages = 0;

    while (!shouldStopCrawling && crawledPages < maxCrawlPages) {
      try {
        crawlURL = linksQueue.length === 0 ? entryURL : linksQueue.shift();

        const { newVideoObject, newLinksQueue } = await crawl(crawlURL);
        linksQueue = linksQueue.concat(newLinksQueue);

        clients.forEach((client) => {
          client.res.write(
            `data: ${JSON.stringify({ result: "ok", message: "succeed", title: newVideoObject.title, url: newVideoObject.youtubeVideoId })}\n\n`,
          );
        });

        crawledPages += 1;
      } catch (error) {
        console.log(error);

        clients.forEach((client) => {
          client.res.write(
            `data: ${JSON.stringify({ result: "ng", message: "fail" })}\n\n`,
          );
        });
      }
    }

    clients.forEach((client) => {
      client.res.write(
        `data: ${JSON.stringify({ result: "ok", message: "ranking videos", title: "db" })}\n\n`,
      );
    });

    res.status(200).send({ result: "ok", message: "crawling finish" });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      result: "ng",
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};

exports.stopCrawling = async function (req, res, next) {
  try {
    shouldStopCrawling = true;

    res.status(200).send({ result: "ok", message: "shouldStopCrawling true" });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      result: "ng",
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};

exports.verifyYoutubeUrl = async function (req, res, next) {
  const { videoUrl } = req.query;
  const youtubeUrlRegex =
    /^https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]+/;

  try {
    if (youtubeUrlRegex.test(videoUrl)) {
      res
        .status(200)
        .send({ result: "ok", message: "correct youtube video url" });
      return;
    }
    res
      .status(200)
      .send({ result: "ng", message: "inCorrect youtube video url" });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      result: "ng",
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};

exports.autoCrawling = async function (req, res, next) {
  const { videoId } = req.body;
  console.log("start auto crawling server", videoId);
  try {
    const videosLinks = await axios.post(`${process.env.AWS_LAMBDA_LINKS}`, {
      videoId,
    });

    console.log("get videos links", videosLinks.data);

    const videoData = await axios.post(`${process.env.AWS_LAMBDA_VIDEOS}`, {
      videoId: videosLinks.data[0],
    });

    console.log("get video data", videoData.data);

    const response = await axios.post(`${process.env.AWS_LAMBDA_DB}`, {
      videoData: videoData.data,
    });

    console.log("insert video data into DB");

    res
      .status(200)
      .send({ result: response.data.result, message: response.data.message });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      result: "ng",
      errorMessage:
        "Hmm...something seems to have gone wrong. Maybe try me again in a little bit.",
    });
  }
};
