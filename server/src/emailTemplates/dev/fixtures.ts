import type { EmailTemplateInput } from "../types";

const deliverableEmailInput: EmailTemplateInput = {
  recipients: [{ name: "State User", address: "state.user@example.com" }],
  cmsOwner: {
    person: {
      email: "cms.owner@example.com",
      firstName: "CMS",
      lastName: "Owner",
    },
  },
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

export const emailTemplateFixtures = {
  "deliverable-created": deliverableEmailInput,
  "deliverable-submitted": deliverableEmailInput,
} satisfies Record<string, EmailTemplateInput>;
