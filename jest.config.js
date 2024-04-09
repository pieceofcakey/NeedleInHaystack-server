module.exports = {
  preset: "@shelf/jest-mongodb",
  testEnvironment: "node",
  collectCoverageFrom: ["./src/**/*.js"],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
  collectCoverage: true,
  coverageReporters: ["lcov", "text"],
  coverageDirectory: "coverage",
};
