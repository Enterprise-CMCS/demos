/* eslint-disable no-undef */

process.env.STAGE = "unit-test";
process.env.REGION = "us-east-1";

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.*(ts|tsx)?$": "ts-jest",
  },
};
