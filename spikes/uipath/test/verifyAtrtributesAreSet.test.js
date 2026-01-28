import "dotenv/config";
import assert from "node:assert/strict";
import { getToken } from "../getToken.js";
import { getExtractorUrl } from "../getExtractorUrl.js";
import {
  getExtractorGuid,
  getProjectId,
} from "../uipathClient.js";

/**
 * This is just a simple test script we can use to debug any issues we have with UIPath API
 *
 * Test: Verify the env exists and that the correct variables are hydrated.
 * Run with: npm run test:vars
 *
 * returns: void
 */
const token = await getToken();
if (!token) {
  passOrFailColorLog("Test Failed: OAuth tokens do not exist.", false);
  throw new Error("Missing access token; check CLIENT_ID/CLIENT_SECRET.");
}
passOrFailColorLog("Test Passed: OAuth tokens exist.", true);

const asyncUrl = await getExtractorUrl(token);
const extractorGuid = getExtractorGuid();
const projectId = getProjectId();

assert.ok(extractorGuid, "extractorGuid should not be null or empty");
passOrFailColorLog("Test Passed: extractorGuid is present.", true);

assert.ok(projectId, "projectId should not be null or empty");
passOrFailColorLog("Test Passed: projectId is present.", true);

assert.ok(asyncUrl, "asyncUrl should not be null or empty");
passOrFailColorLog("Test Passed: async endpoint exists.", true);


function passOrFailColorLog(message, success) {
  const colorCode = success ? "\x1b[32m" : "\x1b[31m"; // Green for pass, Red for fail
  console.log(`${colorCode}${message}\x1b[0m`);
}
