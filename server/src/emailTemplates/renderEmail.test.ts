import { describe, expect, it } from "vitest";

import { renderEmail } from "./renderEmail";

const deliverableEmailInput = {
  cmsOwner: {
    person: {
      email: "cms.owner@example.com",
      firstName: "CMS",
      lastName: "Owner",
    },
  },
  recipients: [
    {
      name: "State User",
      address: "state.user@example.com",
    },
  ],
  deliverable: {
    deliverableTypeId: "Report",
    dueDate: new Date("2026-06-01T12:00:00.000Z"),
    name: "Quarterly Budget Report",
  },
  demonstration: {
    name: "Medicaid Demo Renewal",
    stateId: "MD",
  },
  link: "https://demos.example.gov/deliverables/123",
};

function cleanHtml(html: string): string {
  return html.replaceAll("<!-- -->", "");
}

describe("renderEmail", () => {
  it("renders a deliverable-created emailer payload", async () => {
    const payload = await renderEmail("deliverable-created", deliverableEmailInput);

    expect(payload.to).toEqual([
      {
        name: "CMS Owner",
        address: "cms.owner@example.com",
      },
    ]);
    expect(payload.subject).toBe("CMS DEMOS Deliverable: Deliverable Created");
    expect(payload.text).toContain("You have been assigned a new Report deliverable");
    expect(payload.text).toContain("Current due date: 2026-06-01");
    expect(cleanHtml(payload.html)).toContain("Deliverable type: Report");
  });

  it("renders a deliverable-submitted emailer payload", async () => {
    const payload = await renderEmail("deliverable-submitted", deliverableEmailInput);

    expect(payload.to).toEqual([
      {
        name: "State User",
        address: "state.user@example.com",
      },
    ]);
    expect(payload.subject).toBe("CMS DEMOS Deliverable: Deliverable Submitted");
    expect(payload.text).toContain("A Report deliverable has been submitted");
    expect(payload.text).toContain("Action: Deliverable Submitted");
    expect(cleanHtml(payload.html)).toContain("Current due date: 2026-06-01");
  });

  it("reports unknown templates", async () => {
    await expect(renderEmail("unknown-template", deliverableEmailInput)).rejects.toThrow(
      "Unknown email template: unknown-template"
    );
  });
});
