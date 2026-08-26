import type { ComponentType } from "react";

import type { EmailRecipientGroups } from "../types";

export type DeliverableEmailInput = {
  recipients: EmailRecipientGroups;
  demonstration: {
    id: string;
    name: string;
    stateId: string;
  };
  deliverable: {
    id: string;
    name: string;
    deliverableTypeId: string;
    dueDate: string;
    extensionDecision?: "Approved" | "Denied";
    previousDueDate?: string;
    requestedDueDate?: string;
    statusId: string;
  };
};

export type MultipleDeliverablesEmailInput = {
  recipients: EmailRecipientGroups;
  demonstration: DeliverableEmailInput["demonstration"];
  deliverables: DeliverableEmailInput["deliverable"][];
};

export type MultipleDeliverablesEmailProps = {
  demonstrationTitle: string;
  deliverableNames: string;
  deliverableType: string;
  deliverables: Array<{
    dueDate: string;
    link: string;
  }>;
  state: string;
};

export type DeliverableEmailProps = {
  currentDueDate: string;
  demonstrationTitle: string;
  deliverableName: string;
  deliverableType: string;
  extensionDecision?: "Approved" | "Denied";
  link: string;
  previousDueDate?: string;
  requestedDueDate?: string;
  state: string;
};

export type DeliverableEmailConfig = {
  action: string;
  emailType: string;
  includePreviousDueDate?: boolean;
  includeRequestedDueDate?: boolean;
  Message: ComponentType<DeliverableEmailProps>;
  requiresExtensionDecision?: boolean;
};
