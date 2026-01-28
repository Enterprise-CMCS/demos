import "dotenv/config";
import assert from "node:assert/strict";
import { getToken } from "../getToken.js";
import { getExtractorUrl } from "../getExtractorUrl.js";
import {
  UIPATH_API_VERSION,
  UIPATH_BASE_URL,
  getExtractorGuid,
  getExtractorId,
  getProjectId,
} from "../uipathClient.js";

/**
 * This is jsut a simple test script we can use to debug any issues we have with UIPath.
 *
 * Test: Verify the env exists and that the correct variables are hydrated.
 * Test: Compare the extractor asyncUrl from UIPath api matches constructed URL.
 * Run with: npm run test:extractor-url
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
const extractorId = getExtractorId();

assert.ok(extractorGuid, "extractorGuid should not be null or empty");
passOrFailColorLog("Test Passed: extractorGuid is present.", true);

assert.ok(projectId, "projectId should not be null or empty");
passOrFailColorLog("Test Passed: projectId is present.", true);

assert.ok(extractorId, "extractorId should not be null or empty");
passOrFailColorLog("Test Passed: extractorId is present.", true);

const expectedUrl = `${UIPATH_BASE_URL}:443/${extractorGuid}/du_/api/framework/projects/${projectId}/extractors/${extractorId}/extraction/start?api-version=${UIPATH_API_VERSION}`;

assert.equal(
  asyncUrl,
  expectedUrl,
  `Extractor asyncUrl mismatch.\nExpected: ${expectedUrl}\nActual:   ${asyncUrl}`
);

if (asyncUrl === expectedUrl) {
  passOrFailColorLog("Test Passed: Extractor asyncUrl matches constructed URL.", true);
} else {
  passOrFailColorLog("Test Failed:  Extractor asyncUrl mismatch.\nExpected: " + expectedUrl + "\nActual:   " + asyncUrl, false);
}

function passOrFailColorLog(message, success) {
  const colorCode = success ? "\x1b[32m" : "\x1b[31m"; // Green for pass, Red for fail
  console.log(`${colorCode}${message}\x1b[0m`);
}
