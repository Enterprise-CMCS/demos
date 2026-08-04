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
    previousDueDate?: string;
    statusId: string;
  };
};

export type DeliverableEmailProps = {
  currentDueDate: string;
  demonstrationTitle: string;
  deliverableName: string;
  deliverableType: string;
  link: string;
  previousDueDate?: string;
  state: string;
};

export type DeliverableEmailConfig = {
  action: string;
  id: string;
  includePreviousDueDate?: boolean;
  Message: ComponentType<DeliverableEmailProps>;
};
