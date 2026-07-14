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
    statusId: string;
  };
};

export type DeliverableEmailProps = {
  currentDueDate: string;
  demonstrationTitle: string;
  deliverableName: string;
  deliverableType: string;
  link: string;
  state: string;
};

export type DeliverableEmailConfig = {
  action: string;
  id: string;
  Message: ComponentType<DeliverableEmailProps>;
};
