const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const puppeteer = require("puppeteer");
const Video = require("../models/Video");
const mongooseLoader = require("../loaders/mongoose");

const DEFAULT_TAG_NAME_EN =
  "video, sharing, camera phone, video phone, free, upload";
const DEFAULT_TAG_NAME_KR = "동영상, 공유, 카메라폰, 동영상폰, 무료, 올리기";
const htmlEntryURL = "https://www.youtube.com/watch?v=ok-plXXHlWw";
const cssEntryURL = "https://www.youtube.com/watch?v=OEV8gMkCHXQ";
const javascriptEntryURL = "https://www.youtube.com/watch?v=W6NZfCO5SIk";
const moreButtonSelector = "#expand";
const showTranscriptSelector =
  "#primary-button > ytd-button-renderer > yt-button-shape > button > yt-touch-feedback-shape > div > div.yt-spec-touch-feedback-shape__fill";
const showMoreButtonSelector =
  "#button > ytd-button-renderer > yt-button-shape > button";
const linksSelector =
  "#dismissible > div > div.metadata.style-scope.ytd-compact-video-renderer > a";
const titleSelector = "#title > h1 > yt-formatted-string";
const descriptionSelector =
  "#description-inline-expander > yt-attributed-string > span > span:nth-child(1)";
const channelSelector = "#text > a";
const transcriptSelector =
  "#segments-container > ytd-transcript-segment-renderer yt-formatted-string";
const metaSelector = "meta";

const linksQueue = [];

(async function () {
  await mongooseLoader();
})();

async function crawl(url) {
  const newVideoObj = {};
  newVideoObj.youtubeVideoId = url.split("=")[1];
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForSelector(moreButtonSelector);
  } catch (error) {
    console.error(error);
  }

  try {
    await page.$eval(moreButtonSelector, (button) => button.click());
    await page.waitForSelector(showTranscriptSelector);
  } catch (error) {
    console.error(error);
  }

  try {
    await page.$eval(showTranscriptSelector, (button) => button.click());
    await page.waitForSelector(transcriptSelector);
    await page.waitForSelector(showMoreButtonSelector);
  } catch (error) {
    console.error(error);
  }

  try {
    await page.$eval(showMoreButtonSelector, (button) => button.click());
  } catch (error) {
    console.error(error);
  }

  const links = await page.$$eval(linksSelector, (elements) => {
    return Array.from(elements)
      .map((element) => element.href)
      .slice(0, 5);
  });

  for (const link of links) {
    const hasVisited = await Video.findOne({
      youtubeVideoId: link.split("=")[1],
    });

    if (!hasVisited) {
      linksQueue.push(link);
    }
  }

  const newURL = linksQueue.shift();

  try {
    newVideoObj.title = await page.$eval(
      titleSelector,
      (element) => element.textContent,
    );
  } catch (error) {
    console.error(error);
  }

  try {
    newVideoObj.description = await page.$eval(
      descriptionSelector,
      (element) => element.textContent,
    );
  } catch (error) {
    console.error(error);
  }

  try {
    newVideoObj.channel = await page.$eval(
      channelSelector,
      (element) => element.textContent,
    );
  } catch (error) {
    console.error(error);
  }

  const transcripts = await page.$$eval(transcriptSelector, (elements) =>
    elements.map((element) => element.textContent),
  );

  newVideoObj.transcript = transcripts.join(" ");

  const metaTags = await page.$$eval(metaSelector, (elements) => {
    const result = { thumbnailURL: "", tag: "" };

    elements.forEach((element) => {
      const property = element.getAttribute("property");
      const name = element.getAttribute("name");

      if (property === "og:image") {
        result.thumbnailURL = element.getAttribute("content");
      }

      if (name === "keywords") {
        result.tag = element.getAttribute("content");
      }
    });

    return result;
  });

  newVideoObj.thumbnailURL = metaTags.thumbnailURL;
  newVideoObj.tag = metaTags.tag;

  if (
    newVideoObj.tag === DEFAULT_TAG_NAME_EN ||
    newVideoObj.tag === DEFAULT_TAG_NAME_KR
  ) {
    newVideoObj.tag = "";
  }

  await browser.close();

  try {
    await Video.create(newVideoObj);
    console.log(`Inserted ${url} into DB.`);
  } catch (error) {
    console.error(error);
  }

  crawl(newURL);
}

console.log(`Start crawling`);
crawl(javascriptEntryURL);
