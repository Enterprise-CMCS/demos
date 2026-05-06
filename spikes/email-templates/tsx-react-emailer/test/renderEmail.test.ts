import assert from "node:assert/strict";
import test from "node:test";

import { deliverableCreatedData } from "../fixtures/deliverable-created-data.ts";
import { systemsTestData } from "../fixtures/systems-test-data.ts";
import { renderEmail } from "../src/renderEmail.tsx";

function cleanHtml(html: string): string {
  return html.replaceAll("<!-- -->", "");
}

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
  assert.match(payload.text, /This email template system works./);
  assert.match(payload.text, /This email was sent to Dustin.H@globalalliantinc.com/);
  assert.match(payload.text, /Current due date: 2026-05-04/);
  assert.match(cleanHtml(payload.html), /Hello Dustin,/);
});

test("renders the deliverable-created template as an emailer queue payload", async () => {
  const payload = await renderEmail("deliverable-created", deliverableCreatedData);

  assert.equal(payload.subject, "CMS DEMOS Deliverable: Deliverable Created");
  assert.match(payload.text, /You have been assigned a new Report deliverable/);
  assert.match(payload.text, /due 2026-06-01/);
  assert.match(payload.text, /DEMOS system:/);
  assert.match(payload.text, /https:\/\/demos\.example\.gov\/deliverables\/123\./);
  assert.match(payload.text, /Action: Deliverable Created/);
  assert.match(cleanHtml(payload.html), /Deliverable type: Report/);
});

test("renders the deliverable-submitted template as an emailer queue payload", async () => {
  const payload = await renderEmail("deliverable-submitted", deliverableCreatedData);

  assert.equal(payload.subject, "CMS DEMOS Deliverable: Deliverable Submitted");
  assert.match(payload.text, /A Report deliverable has been submitted for your Demonstration./);
  assert.match(payload.text, /Action: Deliverable Submitted/);
  assert.match(payload.text, /Current due date: 2026-06-01/);
  assert.match(cleanHtml(payload.html), /Action: Deliverable Submitted/);
});

test("reports the missing template variable when render data is incomplete", async () => {
  const data = {
    ...systemsTestData,
    person: {},
  };

  await assert.rejects(
    () => renderEmail("systems-test", data),
    /Missing value for person.givenName while rendering systems-test.data/,
  );
});

test("validates recipients before rendering", async () => {
  const data = {
    ...systemsTestData,
    recipients: {
      to: [],
    },
  };

  await assert.rejects(() => renderEmail("systems-test", data), /recipients.to must include at least one recipient/);
});
