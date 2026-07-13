import { describe, expect, it } from "vitest";

import { renderEmail } from "./renderEmail";

const deliverableCreatedInput = {
  to: "owner@example.com",
  id: "deliverable-1",
  name: "Quarterly Budget Report",
  deliverableType: "Close Out Report",
  dueDate: "2026-06-01T12:00:00.000Z",
  status: "Upcoming",
};

function cleanHtml(html: string): string {
  return html.replaceAll("<!-- -->", "");
}

describe("renderEmail", () => {
  it("renders a deliverable-created emailer payload", async () => {
    const payload = await renderEmail("deliverable-created", deliverableCreatedInput);

    expect(payload.to).toEqual(["owner@example.com"]);
    expect(payload.subject).toBe("CMS DEMOS Deliverable: Deliverable Created");
    expect(payload.text).toContain("Quarterly Budget Report");
    expect(payload.text).toContain("Close Out Report");
    expect(payload.text).toContain("Upcoming");
    expect(payload.text).toContain("2026-06-01");
    expect(cleanHtml(payload.html)).toContain("Quarterly Budget Report");
    expect(cleanHtml(payload.html)).toContain("Close Out Report");
    expect(cleanHtml(payload.html)).toContain("Upcoming");
  });

  it("reports unknown templates", async () => {
    await expect(renderEmail("unknown-template", deliverableCreatedInput)).rejects.toThrow(
      "Unknown email template: unknown-template"
    );
  });

  it("reports missing required payload values", async () => {
    await expect(
      renderEmail("deliverable-created", { ...deliverableCreatedInput, to: "" })
    ).rejects.toThrow("Missing value for to while rendering deliverable-created.data");
  });
});
