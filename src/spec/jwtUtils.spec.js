const jwt = require("jsonwebtoken");
const { verifyAccessToken, verifyRefreshToken } = require("../utils/jwtUtils"); // Adjust the import path
const User = require("../models/User"); // Adjust the import path as necessary

// Mock the jwt and User model for these tests
jest.mock("jsonwebtoken");
jest.mock("../models/User"); // Adjust the path as necessary

describe("Auth Function Tests", () => {
  describe("verifyAccessToken", () => {
    it("validates a good access token", () => {
      // Setup
      const mockUser = { userId: "123" };
      jwt.verify.mockImplementation(() => mockUser);

      // Execute
      const result = verifyAccessToken("good.token");

      // Assert
      expect(result).toEqual({ isValidate: true, userId: mockUser.userId });
      expect(jwt.verify).toHaveBeenCalledWith(
        "good.token",
        process.env.JWT_SECRET_KEY,
      );
    });

    it("handles an error for a bad access token", () => {
      // Setup
      const errorMessage = "invalid token";
      jwt.verify.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute
      const result = verifyAccessToken("bad.token");

      // Assert
      expect(result).toEqual({ isValidate: false, message: errorMessage });
    });
  });

  describe("verifyRefreshToken", () => {
    it("returns true for a valid refresh token and matching user", async () => {
      // Setup
      const userId = "12345";
      const token = "valid.refresh.token";
      User.findById.mockResolvedValue({ refreshToken: token });
      jwt.verify.mockImplementation(() => {});

      // Execute
      const isValid = await verifyRefreshToken(token, userId);

      // Assert
      expect(isValid).toBe(true);
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(jwt.verify).toHaveBeenCalledWith(
        token,
        process.env.JWT_SECRET_KEY,
      );
    });

    it("returns false for a valid refresh token but non-matching user", async () => {
      // Setup
      const userId = "12345";
      const token = "valid.refresh.token";
      User.findById.mockResolvedValue({ refreshToken: "different.token" });

      // Execute
      const isValid = await verifyRefreshToken(token, userId);

      // Assert
      expect(isValid).toBe(false);
    });

    it("returns false for an invalid refresh token", async () => {
      // Setup
      const userId = "12345";
      const token = "invalid.refresh.token";
      User.findById.mockResolvedValue({ refreshToken: token });
      jwt.verify.mockImplementation(() => {
        throw new Error("invalid token");
      });

      // Execute
      const isValid = await verifyRefreshToken(token, userId);

      // Assert
      expect(isValid).toBe(false);
    });
  });
});
