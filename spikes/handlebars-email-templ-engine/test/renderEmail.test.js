import assert from "node:assert/strict";
import test from "node:test";

import { deliverableCreatedData } from "../fixtures/deliverable-created-data.js";
import { systemsTestData } from "../fixtures/systems-test-data.js";
import { renderEmail } from "../src/renderEmail.js";

test("renders the systems-test template as an emailer queue payload", () => {
  const payload = renderEmail("systems-test", systemsTestData, {
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
  assert.match(payload.html, /<p>Hello Dustin,<\/p>/);
});

test("renders the deliverable-created template as an emailer queue payload", () => {
  const payload = renderEmail("deliverable-created", deliverableCreatedData);

  assert.equal(payload.subject, "CMS DEMOS Deliverable: Deliverable Created");
  assert.match(payload.text, /You have been assigned a new Report deliverable/);
  assert.match(payload.text, /due 2026-06-01/);
  assert.match(payload.text, /DEMOS system: https:\/\/demos\.example\.gov\/deliverables\/123\./);
  assert.match(payload.text, /Action: Deliverable Created/);
  assert.match(payload.html, /<a href="https:\/\/demos\.example\.gov\/deliverables\/123">/);
});

test("renders the deliverable-submitted template as an emailer queue payload", () => {
  const payload = renderEmail("deliverable-submitted", deliverableCreatedData);

  assert.equal(payload.subject, "CMS DEMOS Deliverable: Deliverable Submitted");
  assert.match(payload.text, /A Report deliverable has been submitted for your Demonstration\./);
  assert.match(payload.text, /Action: Deliverable Submitted/);
  assert.match(payload.text, /Current due date: 2026-06-01/);
  assert.match(payload.html, /Action: Deliverable Submitted/);
});

test("reports the missing template variable when render data is incomplete", () => {
  const data = {
    ...systemsTestData,
    person: {},
  };

  assert.throws(
    () => renderEmail("systems-test", data),
    /Missing value for person\.givenName while rendering systems-test\.data/,
  );
});

test("validates recipients before rendering", () => {
  const data = {
    ...systemsTestData,
    recipients: {
      to: [],
    },
  };

  assert.throws(() => renderEmail("systems-test", data), /recipients\.to must include at least one recipient/);
});
