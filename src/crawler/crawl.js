const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const puppeteer = require("puppeteer");
const Video = require("../models/Video");
const mongooseLoader = require("../loaders/mongoose");

const DEFAULT_TAG_NAME_EN =
  "video, sharing, camera phone, video phone, free, upload";
const DEFAULT_TAG_NAME_KR = "동영상, 공유, 카메라폰, 동영상폰, 무료, 올리기";

(async function () {
  await mongooseLoader();
})();

async function crawlPage(url) {
  const youtubeVideoId = url.split("=")[1];
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.waitForSelector("#expand");
  } catch (error) {
    console.error(error);
  }

  try {
    await page.$eval("#expand", (button) => button.click());
    await page.waitForSelector(
      "#primary-button > ytd-button-renderer > yt-button-shape > button > yt-touch-feedback-shape > div > div.yt-spec-touch-feedback-shape__fill",
    );
  } catch (error) {
    console.error(error);
  }

  try {
    await page.$eval(
      "#primary-button > ytd-button-renderer > yt-button-shape > button > yt-touch-feedback-shape > div > div.yt-spec-touch-feedback-shape__fill",
      (button) => button.click(),
    );
    await page.waitForSelector(
      "#segments-container > ytd-transcript-segment-renderer yt-formatted-string",
    );
  } catch (error) {
    console.error(error);
  }

  const title = await page.$eval(
    "#title > h1 > yt-formatted-string",
    (el) => el.textContent,
  );
  const description = await page.$eval(
    "#description-inline-expander > yt-attributed-string > span > span:nth-child(1)",
    (el) => el.textContent,
  );
  const channel = await page.$eval("#text > a", (el) => el.textContent);
  const transcripts = await page.$$eval(
    "#segments-container > ytd-transcript-segment-renderer yt-formatted-string",
    (elements) => elements.map((el) => el.textContent),
  );
  const transcript = transcripts.join(" ");
  const metaTags = await page.$$eval("meta", (elements) => {
    const result = { thumbnailURL: "", tag: "" };

    elements.forEach((el) => {
      const property = el.getAttribute("property");
      const name = el.getAttribute("name");

      if (property === "og:image") {
        result.thumbnailURL = el.getAttribute("content");
      }

      if (name === "keywords") {
        result.tag = el.getAttribute("content");
      }
    });

    return result;
  });

  const { thumbnailURL } = metaTags;
  let { tag } = metaTags;

  if (tag === DEFAULT_TAG_NAME_EN || tag === DEFAULT_TAG_NAME_KR) {
    tag = "";
  }

  const video = {
    youtubeVideoId,
    title,
    description,
    channel,
    transcript,
    thumbnailURL,
    tag,
  };

  await Video.create({
    youtubeVideoId: video.youtubeVideoId,
    title: video.title,
    description: video.description,
    channel: video.channel,
    transcript: video.transcript,
    thumbnailURL: video.thumbnailURL,
    tag: video.tag,
  });

  console.log(`Inserted ${url} into the database`);
  await browser.close();
}

console.log("Start crawling");

crawlPage("https://www.youtube.com/watch?v=IkmPjeNKkBQ");
