/* eslint-disable no-undef */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.*(ts|tsx)?$": "ts-jest",
  },
  transformIgnorePatterns: ["node_modules/?!(chalk)/"],
};
