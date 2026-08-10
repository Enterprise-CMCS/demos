import { describe, expect, it } from "vitest";

import { renderEmail } from "./renderEmail";

const deliverableCreatedInput = {
  recipients: {
    to: [],
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
    extensionDecision: "Approved" as const,
    previousDueDate: "2026-05-01T12:00:00.000Z",
    requestedDueDate: "2026-07-01T12:00:00.000Z",
    statusId: "Upcoming",
  },
};

function cleanHtml(html: string): string {
  return html.replaceAll("<!-- -->", "");
}

describe("renderEmail", () => {
  it("renders a deliverable-created emailer payload", async () => {
    const payload = await renderEmail("deliverable-created", deliverableCreatedInput);

    expect(payload.to).toEqual([]);
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

  it("renders one email for multiple created deliverables", async () => {
    const payload = await renderEmail("multiple-deliverables-created", {
      recipients: deliverableCreatedInput.recipients,
      demonstration: deliverableCreatedInput.demonstration,
      deliverables: [
        deliverableCreatedInput.deliverable,
        {
          ...deliverableCreatedInput.deliverable,
          id: "deliverable-2",
          name: "DY1Q2 Quarterly Budget Report",
          dueDate: "2026-09-01T12:00:00.000Z",
        },
      ],
    });

    expect(payload.subject).toBe(
      "CMS DEMOS Deliverables: Multiple Deliverables Created"
    );
    expect(payload.text).toContain(
      "You have been assigned new Close Out Report deliverables for your Demonstration."
    );
    expect(payload.text).toContain(
      "http://localhost:3000/deliverables/deliverable-1 due on 2026-06-01"
    );
    expect(payload.text).toContain(
      "http://localhost:3000/deliverables/deliverable-2 due on 2026-09-01"
    );
    expect(payload.text).toContain(
      "Deliverables: Quarterly Budget Report, DY1Q2 Quarterly Budget Report"
    );
    expect(payload.text).toContain("Action: Multiple Deliverables Created");
  });

  it("requires multiple deliverables for the grouped template", async () => {
    await expect(
      renderEmail("multiple-deliverables-created", {
        recipients: deliverableCreatedInput.recipients,
        demonstration: deliverableCreatedInput.demonstration,
        deliverables: [deliverableCreatedInput.deliverable],
      })
    ).rejects.toThrow(
      "Multiple Deliverables Created email requires at least two deliverables."
    );
  });

  it("renders a deliverable-submitted email from the same shared parts", async () => {
    const payload = await renderEmail("deliverable-submitted", deliverableCreatedInput);

    expect(payload.subject).toBe("CMS DEMOS Deliverable: Deliverable Submitted");
    expect(payload.text).toContain("A Close Out Report deliverable has been submitted");
    expect(payload.text).toContain("Action: Deliverable Submitted");
    expect(payload.text).toContain("Current due date: 2026-06-01");
    expect(cleanHtml(payload.html)).toContain("Demonstration: Medicaid Demonstration");
  });

  it("renders a deliverable due date updated email", async () => {
    const payload = await renderEmail(
      "deliverable-due-date-updated",
      deliverableCreatedInput
    );

    expect(payload.subject).toBe("CMS DEMOS Deliverable: Deliverable Due Date Updated");
    expect(payload.text).toContain(
      "A Close Out Report deliverable has a new due date. Submission is now due on 2026-06-01."
    );
    expect(payload.text).toContain("Action: Deliverable Due Date Updated");
    expect(payload.text).toContain("Previous due date: 2026-05-01");
    expect(payload.text).toContain("Current due date: 2026-06-01");
    expect(payload.text).toContain("http://localhost:3000/deliverables/deliverable-1");
  });

  it("reports a missing previous due date for a due date updated email", async () => {
    await expect(
      renderEmail("deliverable-due-date-updated", {
        ...deliverableCreatedInput,
        deliverable: {
          ...deliverableCreatedInput.deliverable,
          previousDueDate: undefined,
        },
      })
    ).rejects.toThrow(
      "Missing value for deliverable.previousDueDate while rendering deliverable-due-date-updated.data"
    );
  });

  it.each([
    ["deliverable-accepted", "Accepted"],
    ["deliverable-approved", "Approved"],
    ["deliverable-received-and-filed", "Received and Filed"],
  ])("renders the %s completion template", async (templateId, action) => {
    const payload = await renderEmail(templateId, deliverableCreatedInput);

    expect(payload.subject).toBe(`CMS DEMOS Deliverable: ${action}`);
    expect(payload.text).toContain(
      `CMS has ${action} a Close Out Report deliverable. View this deliverable in the DEMOS system:`
    );
    expect(payload.text).toContain(`Action: ${action}`);
  });

  it("renders an extension-requested template", async () => {
    const payload = await renderEmail("extension-requested", deliverableCreatedInput);

    expect(payload.subject).toBe("CMS DEMOS Deliverable: Extension Requested");
    expect(payload.text).toContain(
      "A state user has requested an extension for a Close Out Report deliverable, originally due on 2026-06-01."
    );
    expect(payload.text).toContain("Requested due date: 2026-07-01");
  });

  it("renders an extension-decision-made template", async () => {
    const payload = await renderEmail("extension-decision-made", deliverableCreatedInput);

    expect(payload.subject).toBe("CMS DEMOS Deliverable: Extension Decision Made");
    expect(payload.text).toContain(
      "CMS has Approved an extension request for your Close Out Report deliverable. The current due date is 2026-06-01."
    );
    expect(payload.text).toContain("Previous due date: 2026-05-01");
  });

  it("renders a resubmission-requested template", async () => {
    const payload = await renderEmail("resubmission-requested", deliverableCreatedInput);

    expect(payload.subject).toBe("CMS DEMOS Deliverable: Resubmission Requested");
    expect(payload.text).toContain(
      "CMS has requested a resubmission for a Close Out Report deliverable, due on 2026-06-01."
    );
    expect(payload.text).toContain("Previous due date: 2026-05-01");
  });

  it("renders a public-comment-added template", async () => {
    const payload = await renderEmail("public-comment-added", deliverableCreatedInput);

    expect(payload.subject).toBe("CMS DEMOS Deliverable: Public Comment Added");
    expect(payload.text).toContain(
      "A public comment has been added to a Close Out Report deliverable."
    );
    expect(payload.text).toContain("Action: Public Comment Added");
    expect(payload.text).not.toContain("Free insulin is a good policy proposal");
  });

  it("reports missing extension-specific values", async () => {
    await expect(
      renderEmail("extension-requested", {
        ...deliverableCreatedInput,
        deliverable: {
          ...deliverableCreatedInput.deliverable,
          requestedDueDate: undefined,
        },
      })
    ).rejects.toThrow(
      "Missing value for deliverable.requestedDueDate while rendering extension-requested.data"
    );

    await expect(
      renderEmail("extension-decision-made", {
        ...deliverableCreatedInput,
        deliverable: {
          ...deliverableCreatedInput.deliverable,
          extensionDecision: undefined,
        },
      })
    ).rejects.toThrow(
      "Missing value for deliverable.extensionDecision while rendering extension-decision-made.data"
    );
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

  it("requires at least one recipient across all BCC-only recipient groups", async () => {
    await expect(
      renderEmail("deliverable-created", {
        ...deliverableCreatedInput,
        recipients: {
          to: [],
          bcc: [],
        },
      })
    ).rejects.toThrow("Email template must include at least one recipient.");
  });
});
