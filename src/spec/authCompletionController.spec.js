const app = require("../../app");
const request = require("supertest");
const { setupDB } = require("./setup");

setupDB();

describe("Auto Completion", () => {
  describe("Get `/auto-completions`", () => {
    it("should return list of auto completions without log in", async () => {
      const response = await request(app).get("/auto-completions").query({
        userInput: "java",
      });

      const { searchHistories } = response.body;

      expect(response.statusCode).toBe(200);
      expect(searchHistories.length).toBeLessThan(11);

      searchHistories.forEach((searchHistory) => {
        expect(searchHistory.slice(0, 4)).toBe("java");
      });
    });
  });
});
