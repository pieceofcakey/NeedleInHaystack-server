const app = require("../../app");
const request = require("supertest");
const { setupDB } = require("./setup");
const axios = require("axios");

setupDB();
jest.mock("axios");

describe("Extract Code Controller", () => {
  describe("POST extraction/", () => {
    it("should extract code from screenshot", async () => {
      axios.post.mockResolvedValue({
        data: {
          extractedCode: "test code",
        },
      });

      const response = await request(app).post("/extraction");

      expect(response.statusCode).toBe(200);
      expect(response.body.extractedCode).toBe("test code");
    });
  });
});
