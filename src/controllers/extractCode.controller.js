const { DEFAULT_INTERCEPT_RESOLUTION_PRIORITY } = require("puppeteer");
const puppeteer = require("puppeteer-extra");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const { createWorker } = require("tesseract.js");

const wait = require("../utils/wait");
const { IMAGE_WIDTH, IMAGE_HEIGHT } = require("../constants/imageConstants");

exports.extractCode = async function (req, res, next) {
  const {
    clientCoordinate,
    videoSize,
    captureBoxSize,
    currentVideoTime,
    youtubeVideoId,
  } = req.body;

  const widthRatio = IMAGE_WIDTH / videoSize.width;
  const heightRatio = IMAGE_HEIGHT / videoSize.height;
  const startCoordinate = {
    left: Math.round(clientCoordinate.left * widthRatio),
    top: Math.round(clientCoordinate.top * heightRatio),
  };
  const screenshotSize = {
    width: Math.round(captureBoxSize.width * widthRatio),
    height: Math.round(captureBoxSize.height * widthRatio),
  };

  puppeteer.use(
    AdblockerPlugin({
      interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
    }),
  );

  let extractedCode = "";

  async function launchPuppeteer() {
    const browser = await puppeteer.launch({
      headless: "new",
      defaultViewport: null,
      args: ["--autoplay-policy=no-user-gesture-required"],
    });
    const page = await browser.newPage();

    await page.goto(
      `https://www.youtube.com/watch?v=${youtubeVideoId}&t=${currentVideoTime - 5}`,
      {
        waitUntil: "networkidle0",
      },
    );

    const video = await page.$(".html5-video-player");
    const isSubtitleOn = await page.$eval(".ytp-subtitles-button", (element) =>
      element.getAttribute("aria-pressed"),
    );

    if (isSubtitleOn === "true") {
      await page.$eval(".ytp-subtitles-button", (button) => button.click());
    }

    await page.$eval(".ytp-settings-button", (button) => button.click());
    await page.$eval(
      "#ytp-id-18 > div > div > div:nth-last-child(1)",
      (element) => element.click(),
    );

    await wait(300);

    await page.$eval(
      "#ytp-id-18 > div > div.ytp-panel-menu > div:nth-child(1)",
      (element) => element.click(),
    );

    await page.evaluate(() => {
      const controlBar = document.querySelector(".ytp-chrome-bottom");
      const waterMark = document.querySelector(".annotation-type-custom");
      const paidContent = document.querySelector(".ytp-paid-content-overlay");

      controlBar.style.display = "none";

      if (waterMark) {
        waterMark.style.display = "none";
      }

      if (paidContent) {
        paidContent.style.display = "none";
      }
    });

    await wait(3000);

    await video.screenshot({
      path: "screenshot.png",
    });

    await browser.close();

    const worker = await createWorker("eng");
    const rectangle = {
      left: startCoordinate.left,
      top: startCoordinate.top,
      width: screenshotSize.width,
      height: screenshotSize.height,
    };
    const image = await worker.recognize("screenshot.png", {
      rectangle,
    });

    extractedCode = image.data.text;
    await worker.terminate();
  }

  try {
    await launchPuppeteer();
    res.status(200).send({ extractedCode });
  } catch (err) {
    console.error(err);
    res.status(200).send({ result: "ng", message: "fail" });
  }
};
