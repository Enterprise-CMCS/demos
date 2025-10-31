/* eslint-disable no-undef */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", {isolatedModules: true}],
  },
  transformIgnorePatterns: [".*/node_modules/(?!(chalk)/)"],
};
