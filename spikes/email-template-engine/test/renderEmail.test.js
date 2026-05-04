const assert = require("node:assert/strict");
const test = require("node:test");

const { renderEmail } = require("../src/renderEmail");
const { deliverableCreatedData } = require("../fixtures/deliverable-created-data");
const { systemsTestData } = require("../fixtures/systems-test-data");

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
  assert.match(payload.html, /<strong>Deliverable type:<\/strong> Report/);
});

test("reports the missing template variable when render data is incomplete", () => {
  const data = {
    ...systemsTestData,
    person: {},
  };

  assert.throws(
    () => renderEmail("systems-test", data),
    /Missing value for <Person\.Given Name> at person\.givenName while rendering systems-test\.text/,
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
