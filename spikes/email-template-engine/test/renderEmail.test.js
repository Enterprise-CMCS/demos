import assert from "node:assert/strict";
import test from "node:test";

import { deliverableCreatedData } from "../fixtures/deliverable-created-data.js";
import { systemsTestData } from "../fixtures/systems-test-data.js";
import { renderEmail } from "../src/renderEmail.js";

test("renders the systems-test template as an emailer queue payload", async () => {
  const payload = await renderEmail("systems-test", systemsTestData, {
    now: new Date("2026-05-04T12:00:00.000Z"),
  });

  assert.deepEqual(payload.to, [
    {
      name: "Dustin Horning",
      address: "Dustin.H@globalalliantinc.com",
    },
  ]);
  assert.equal(payload.subject, "Dear Admin User, Email functionality is nominal");
  assert.match(payload.text, /Hello Dustin,/);
  assert.match(payload.text, /This email template system works\./);
  assert.match(payload.text, /This email was sent to Dustin\.H@globalalliantinc\.com/);
  assert.match(payload.text, /Current due date: 2026-05-04/);
  assert.match(payload.html, /Hello Dustin,/);
});

test("renders the deliverable-created template as an emailer queue payload", async () => {
  const payload = await renderEmail("deliverable-created", deliverableCreatedData);

  assert.deepEqual(payload.to, [
    {
      name: "Dustin Horning",
      address: "Dustin.H@globalalliantinc.com",
    },
  ]);
  assert.equal(payload.subject, "CMS DEMOS Deliverable: Deliverable Created");
  assert.match(payload.text, /You have been assigned a new Report deliverable/);
  assert.match(payload.text, /due 2026-06-01/);
  assert.match(payload.text, /DEMOS system: https:\/\/demos\.example\.gov\/deliverables\/123\./);
  assert.match(payload.text, /Demonstration: Medicaid Demo Renewal/);
  assert.match(payload.text, /State: MD/);
  assert.match(payload.text, /Deliverable: Quarterly Budget Report/);
  assert.match(payload.text, /Action: Deliverable Created/);
  assert.match(payload.text, /Current due date: 2026-06-01/);
  assert.match(payload.html, /Deliverable type: Report/);
});

test("reports the missing template variable when render data is incomplete", async () => {
  const data = {
    ...systemsTestData,
    person: {},
  };

  await assert.rejects(
    () => renderEmail("systems-test", data),
    /Missing value for person\.givenName at person\.givenName while rendering systems-test\.data/,
  );
});

test("validates recipients before rendering", async () => {
  const data = {
    ...systemsTestData,
    recipients: {
      to: [],
    },
  };

  await assert.rejects(() => renderEmail("systems-test", data), /recipients\.to must include at least one recipient/);
});
