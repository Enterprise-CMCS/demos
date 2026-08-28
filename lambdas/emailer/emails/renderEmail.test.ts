import { describe, expect, it } from "vitest";

import { renderEmail } from "./renderEmail";

const deliverableInput = {
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

const multipleDeliverablesInput = {
  recipients: deliverableInput.recipients,
  demonstration: deliverableInput.demonstration,
  deliverables: [
    deliverableInput.deliverable,
    {
      ...deliverableInput.deliverable,
      id: "deliverable-2",
      name: "DY1Q2 Quarterly Budget Report",
      dueDate: "2026-09-01T12:00:00.000Z",
    },
  ],
};

const templateCases = [
  {
    emailType: "Deliverable Created",
    input: deliverableInput,
    subject: "CMS DEMOS Deliverable: Deliverable Created",
    expectedText: [
      "You have been assigned a new Close Out Report deliverable",
      "Action: Deliverable Created",
    ],
  },
  {
    emailType: "Deliverable Due Date Updated",
    input: deliverableInput,
    subject: "CMS DEMOS Deliverable: Deliverable Due Date Updated",
    expectedText: [
      "A Close Out Report deliverable has a new due date",
      "Previous due date: 2026-05-01",
    ],
  },
  {
    emailType: "Deliverable Submitted",
    input: deliverableInput,
    subject: "CMS DEMOS Deliverable: Deliverable Submitted",
    expectedText: [
      "A Close Out Report deliverable has been submitted",
      "Action: Deliverable Submitted",
    ],
  },
  {
    emailType: "Deliverable Accepted",
    input: deliverableInput,
    subject: "CMS DEMOS Deliverable: Accepted",
    expectedText: [
      "CMS has Accepted a Close Out Report deliverable",
      "Action: Accepted",
    ],
  },
  {
    emailType: "Deliverable Approved",
    input: deliverableInput,
    subject: "CMS DEMOS Deliverable: Approved",
    expectedText: [
      "CMS has Approved a Close Out Report deliverable",
      "Action: Approved",
    ],
  },
  {
    emailType: "Deliverable Received and Filed",
    input: deliverableInput,
    subject: "CMS DEMOS Deliverable: Received and Filed",
    expectedText: [
      "CMS has Received and Filed a Close Out Report deliverable",
      "Action: Received and Filed",
    ],
  },
  {
    emailType: "Extension Requested",
    input: deliverableInput,
    subject: "CMS DEMOS Deliverable: Extension Requested",
    expectedText: [
      "A state user has requested an extension for a Close Out Report deliverable",
      "Requested due date: 2026-07-01",
    ],
  },
  {
    emailType: "Extension Decision Made",
    input: deliverableInput,
    subject: "CMS DEMOS Deliverable: Extension Decision Made",
    expectedText: [
      "CMS has Approved an extension request for your Close Out Report deliverable",
      "Previous due date: 2026-05-01",
    ],
  },
  {
    emailType: "Resubmission Requested",
    input: deliverableInput,
    subject: "CMS DEMOS Deliverable: Resubmission Requested",
    expectedText: [
      "CMS has requested a resubmission for a Close Out Report deliverable",
      "Previous due date: 2026-05-01",
    ],
  },
  {
    emailType: "Public Comment Added",
    input: deliverableInput,
    subject: "CMS DEMOS Deliverable: Public Comment Added",
    expectedText: [
      "A public comment has been added to a Close Out Report deliverable",
      "Action: Public Comment Added",
    ],
  },
  {
    emailType: "Multiple Deliverables Created",
    input: multipleDeliverablesInput,
    subject: "CMS DEMOS Deliverables: Multiple Deliverables Created",
    expectedText: [
      "You have been assigned new Close Out Report deliverables",
      "https://localhost:3000/deliverables/deliverable-1 due on 2026-06-01",
      "https://localhost:3000/deliverables/deliverable-2 due on 2026-09-01",
      "Deliverables: Quarterly Budget Report, DY1Q2 Quarterly Budget Report",
    ],
  },
];

const singleDeliverableEmailTypes = templateCases
  .map(({ emailType }) => emailType)
  .filter((emailType) => emailType !== "Multiple Deliverables Created");

function cleanHtml(html: string): string {
  return html.replaceAll("<!-- -->", "");
}

describe("renderEmail", () => {
  it("renders every registered template", async () => {
    for (const { emailType, expectedText, input, subject } of templateCases) {
      const payload = await renderEmail(emailType, input);

      expect(payload.to).toEqual([]);
      expect(payload.bcc).toEqual(["cms.owner@example.com"]);
      expect(payload.subject).toBe(subject);
      expect(payload.text).toContain("Medicaid Demonstration");
      expect(payload.text).toContain("MD");
      expect(cleanHtml(payload.html)).toContain("Medicaid Demonstration");
      for (const text of expectedText) {
        expect(payload.text).toContain(text);
      }
    }
  });

  it("requires multiple deliverables for the grouped template", async () => {
    await expect(
      renderEmail("Multiple Deliverables Created", {
        ...multipleDeliverablesInput,
        deliverables: [deliverableInput.deliverable],
      }),
    ).rejects.toThrow(
      "Multiple Deliverables Created email requires at least two deliverables.",
    );
  });

  it("reports missing template-specific values", async () => {
    await expect(
      renderEmail("Deliverable Due Date Updated", {
        ...deliverableInput,
        deliverable: {
          ...deliverableInput.deliverable,
          previousDueDate: undefined,
        },
      }),
    ).rejects.toThrow(
      "Missing value for deliverable.previousDueDate while rendering Deliverable Due Date Updated.data",
    );

    await expect(
      renderEmail("Extension Requested", {
        ...deliverableInput,
        deliverable: {
          ...deliverableInput.deliverable,
          requestedDueDate: undefined,
        },
      }),
    ).rejects.toThrow(
      "Missing value for deliverable.requestedDueDate while rendering Extension Requested.data",
    );

    await expect(
      renderEmail("Extension Decision Made", {
        ...deliverableInput,
        deliverable: {
          ...deliverableInput.deliverable,
          extensionDecision: undefined,
        },
      }),
    ).rejects.toThrow(
      "Missing value for deliverable.extensionDecision while rendering Extension Decision Made.data",
    );

    await expect(
      renderEmail("Resubmission Requested", {
        ...deliverableInput,
        deliverable: {
          ...deliverableInput.deliverable,
          previousDueDate: undefined,
        },
      }),
    ).rejects.toThrow(
      "Missing value for deliverable.previousDueDate while rendering Resubmission Requested.data",
    );
  });

  it("reports unknown templates", async () => {
    await expect(
      renderEmail("Unknown Email", deliverableInput),
    ).rejects.toThrow("Unsupported email type: Unknown Email");
  });

  it("reports missing recipient data", async () => {
    await expect(
      renderEmail("Deliverable Created", {
        ...deliverableInput,
        recipients: undefined,
      }),
    ).rejects.toThrow(
      "Missing value for recipients while rendering Deliverable Created.data",
    );
  });

  it("reports invalid deliverable payload shapes", async () => {
    await expect(
      renderEmail("Deliverable Created", {
        ...deliverableInput,
        demonstration: "not-an-object",
      }),
    ).rejects.toThrow(
      "Invalid value for demonstration while rendering Deliverable Created.data: expected an object.",
    );

    await expect(
      renderEmail("Deliverable Created", {
        ...deliverableInput,
        deliverable: {
          ...deliverableInput.deliverable,
          name: 42,
        },
      }),
    ).rejects.toThrow(
      "Invalid value for deliverable.name while rendering Deliverable Created.data: expected a string.",
    );

    await expect(
      renderEmail("Extension Decision Made", {
        ...deliverableInput,
        deliverable: {
          ...deliverableInput.deliverable,
          extensionDecision: "Maybe",
        },
      }),
    ).rejects.toThrow(
      "Invalid value for deliverable.extensionDecision while rendering Extension Decision Made.data: expected Approved or Denied.",
    );
  });

  it("all single-deliverable templates validate their common fields", async () => {
    for (const emailType of singleDeliverableEmailTypes) {
      await expect(
        renderEmail(emailType, {
          ...deliverableInput,
          deliverable: {
            ...deliverableInput.deliverable,
            name: undefined,
          },
        }),
      ).rejects.toThrow(
        `Missing value for deliverable.name while rendering ${emailType}.data`,
      );
    }
  });

  it("requires at least one recipient", async () => {
    await expect(
      renderEmail("Deliverable Created", {
        ...deliverableInput,
        recipients: {
          to: [],
          bcc: [],
        },
      }),
    ).rejects.toThrow("Email template must include at least one recipient.");
  });
});
