import { describe, expect, it } from "vitest";

import { renderEmail } from "./renderEmail";

const deliverableCreatedInput = {
  recipients: {
    to: [{ name: "Current User", address: "current.user@example.com" }],
    bcc: ["cms.owner@example.com"],
  },
  demonstration: {
    id: "demonstration-1",
    name: "Medicaid Demonstration",
    stateId: "MD",
  },
  deliverable: {
    id: "deliverable-1",
    name: "Quarterly Budget Report",
    deliverableTypeId: "Close Out Report",
    dueDate: "2026-06-01T12:00:00.000Z",
    statusId: "Upcoming",
  },
};

function cleanHtml(html: string): string {
  return html.replaceAll("<!-- -->", "");
}

describe("renderEmail", () => {
  it("renders a deliverable-created emailer payload", async () => {
    const payload = await renderEmail("deliverable-created", deliverableCreatedInput);

    expect(payload.to).toEqual([
      { name: "Current User", address: "current.user@example.com" },
    ]);
    expect(payload.bcc).toEqual(["cms.owner@example.com"]);
    expect(payload.subject).toBe("CMS DEMOS Deliverable: Deliverable Created");
    expect(payload.text).toContain("You have been assigned a new Close Out Report deliverable");
    expect(payload.text).toContain("Medicaid Demonstration");
    expect(payload.text).toContain("MD");
    expect(payload.text).toContain("Quarterly Budget Report");
    expect(payload.text).toContain("Close Out Report");
    expect(payload.text).toContain("2026-06-01");
    expect(payload.text).toContain("http://localhost:3000/deliverables/deliverable-1");
    expect(cleanHtml(payload.html)).toContain("Quarterly Budget Report");
    expect(cleanHtml(payload.html)).toContain("Close Out Report");
  });

  it("renders a deliverable-submitted email from the same shared parts", async () => {
    const payload = await renderEmail("deliverable-submitted", deliverableCreatedInput);

    expect(payload.subject).toBe("CMS DEMOS Deliverable: Deliverable Submitted");
    expect(payload.text).toContain("A Close Out Report deliverable has been submitted");
    expect(payload.text).toContain("Action: Deliverable Submitted");
    expect(payload.text).toContain("Current due date: 2026-06-01");
    expect(cleanHtml(payload.html)).toContain("Demonstration: Medicaid Demonstration");
  });

  it("reports unknown templates", async () => {
    await expect(renderEmail("unknown-template", deliverableCreatedInput)).rejects.toThrow(
      "Unknown email template: unknown-template"
    );
  });

  it("reports missing required payload values", async () => {
    await expect(
      renderEmail("deliverable-created", {
        ...deliverableCreatedInput,
        recipients: undefined,
      })
    ).rejects.toThrow("Missing value for recipients while rendering deliverable-created.data");
  });
});
