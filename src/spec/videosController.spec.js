const request = require("supertest");
const app = require("../../app");
const { setupDB } = require("./setup");

const Keyword = require("../models/Keyword");

setupDB();

describe("fetch Videos", () => {
  describe("POST `/keywords`", () => {
    it("should send user Input and return videos", async () => {
      const response = await request(app)
        .post("/keywords")
        .send({
          userInput: ["javascript"],
          pageParam: 1,
          shouldCheckSpell: true,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.result).toBe("ok");
      expect(response.body.videos.length).toBe(10);
      expect(response.body.nextPage).toBe(2);
      expect(response.body.query).toBe("javascript");
    });

    it("should correct misspelled user input", async () => {
      const response = await request(app)
        .post("/keywords")
        .send({
          userInput: ["javascrpt javascriptt javascriipt"],
          pageParam: 1,
          shouldCheckSpell: true,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.result).toBe("ok");
      expect(response.body.videos.length).toBe(10);
      expect(response.body.nextPage).toBe(2);
      expect(response.body.query).toBe("javascrpt javascriptt javascriipt");
      expect(response.body.correctedInput).toBe(
        "javascript javascript javascript",
      );
    });

    it("when return videos are empty", async () => {
      const response = await request(app)
        .post("/keywords")
        .send({
          userInput: ["jsscript"],
          pageParam: 1,
          shouldCheckSpell: true,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.result).toBe("null");
      expect(response.body.videos.length).toBe(0);
      expect(response.body.query).toBe("jsscript");
    });
  });
});
