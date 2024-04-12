const app = require("../../app");
const request = require("supertest");
const { setupDB } = require("./setup");
const { crawl } = require("../crawler/crawl");
const Link = require("../models/Link");

setupDB();
jest.mock("../crawler/crawl");
jest.mock("../models/Link");

describe("Crawling Controller", () => {
  describe("GET admin/startCrawling", () => {
    it("should start crawling", async () => {
      crawl.mockResolvedValue({
        newVideoObject: {
          title: "test title",
          youtubeVideoId: "test video id",
        },
        newLinksQueue: [],
      });

      const response = await request(app)
        .get("/admin/startCrawling")
        .query({ maxCrawlPages: 2, entryURL: "testURL" });

      expect(response.statusCode).toBe(200);
      expect(response.body.result).toBe("ok");
      expect(response.body.message).toBe("crawling finish");
    });
  });

  describe("GET admin/stopCrawling", () => {
    it("should stop crawling", async () => {
      const response = await request(app).get("/admin/stopCrawling");

      expect(response.statusCode).toBe(200);
      expect(response.body.result).toBe("ok");
      expect(response.body.message).toBe("shouldStopCrawling true");
    });
  });

  describe("GET admin/verifyYoutubeUrl", () => {
    it("should verify invalid youtubeUrl", async () => {
      const response = await request(app)
        .get("/admin/verifyYoutubeUrl")
        .query({ videoUrl: "invalidUrl" });

      expect(response.statusCode).toBe(200);
      expect(response.body.result).toBe("ng");
      expect(response.body.message).toBe("inCorrect youtube video url");
    });

    it("should verify valid youtubeUrl", async () => {
      const response = await request(app)
        .get("/admin/verifyYoutubeUrl")
        .query({ videoUrl: "https://www.youtube.com/watch?v=validurl123" });

      expect(response.statusCode).toBe(200);
      expect(response.body.result).toBe("ok");
      expect(response.body.message).toBe("correct youtube video url");
    });
  });

  describe("POST admin/saveVideoId", () => {
    it("should save videoId", async () => {
      Link.findOne.mockResolvedValue({
        links: ["test link1", "test link2"],
        save: jest.fn(),
      });

      const response = await request(app)
        .post("/admin/saveVideoId")
        .send({ videoId: "test videoId" });

      expect(response.statusCode).toBe(200);
      expect(response.body.result).toBe("ok");
    });
  });
});
