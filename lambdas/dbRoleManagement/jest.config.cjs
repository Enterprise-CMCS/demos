/* eslint-disable no-undef */

process.env.STAGE = "unit-test";
process.env.REGION = "us-east-1";
process.env.DATABASE_SECRET_ARN = "fake-secret"; // pragma: allowlist secret

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.*(ts|tsx)?$": "ts-jest",
  },
};
