module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/deployment"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};
