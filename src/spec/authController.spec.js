const app = require("../../app");
const request = require("supertest");
const { setupDB } = require("./setup");

setupDB();

describe.only("Auth Controller", () => {
  describe("POST /signIn", () => {
    it("should create a new user and return token", async () => {
      const mockUser = {
        _id: "1",
        email: "test@test.com",
        displayName: "tester",
        photoURL: "testURL",
      };

      const response = await request(app).post("/auth/signIn").send(mockUser);

      expect(response.statusCode).toBe(201);
      expect(response.body.result).toBe("ok");
      expect(response.body.message).toBe("login successful!");
      expect(response.body.user.email).toBe("test@test.com");
      expect(response.headers["set-cookie"]).toBeDefined();
    });
  });
});
