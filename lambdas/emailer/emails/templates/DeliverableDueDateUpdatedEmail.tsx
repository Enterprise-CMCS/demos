import { Text } from "@react-email/components";

import { DeliverableEmailLayout } from "../components/DeliverableEmailLayout";
import { DeliverableLink } from "../components/DeliverableLink";
import { detailStyle, textStyle } from "../components/styles";
import {
  formatDate,
  getDemosAppUrl,
  getRequiredObject,
  getRequiredString,
} from "../helpers";
import type { EmailTemplateResult } from "../types";

const emailType = "Deliverable Due Date Updated";

export function renderDeliverableDueDateUpdatedEmail(
  input: unknown,
): EmailTemplateResult {
  const payload = getRequiredObject(input, "payload", emailType);
  const demonstration = getRequiredObject(
    payload.demonstration,
    "demonstration",
    emailType,
  );
  const deliverable = getRequiredObject(
    payload.deliverable,
    "deliverable",
    emailType,
  );
  const deliverableType = getRequiredString(
    deliverable.deliverableTypeId,
    "deliverable.deliverableTypeId",
    emailType,
  );
  const previousDueDate = formatDate(
    getRequiredString(
      deliverable.previousDueDate,
      "deliverable.previousDueDate",
      emailType,
    ),
  );
  const currentDueDate = formatDate(
    getRequiredString(deliverable.dueDate, "deliverable.dueDate", emailType),
  );
  const link = `${getDemosAppUrl()}/deliverables/${getRequiredString(
    deliverable.id,
    "deliverable.id",
    emailType,
  )}`;

  return {
    subject: "CMS DEMOS Deliverable: Deliverable Due Date Updated",
    content: (
      <DeliverableEmailLayout
        action={emailType}
        demonstrationTitle={getRequiredString(
          demonstration.name,
          "demonstration.name",
          emailType,
        )}
        deliverableName={getRequiredString(
          deliverable.name,
          "deliverable.name",
          emailType,
        )}
        deliverableType={deliverableType}
        message={
          <Text style={textStyle}>
            A {deliverableType} deliverable has a new due date. Submission is now
            due on {currentDueDate}. <DeliverableLink href={link} />
          </Text>
        }
        state={getRequiredString(
          demonstration.stateId,
          "demonstration.stateId",
          emailType,
        )}
        dateDetails={
          <>
            <Text style={detailStyle}>Previous due date: {previousDueDate}</Text>
            <Text style={detailStyle}>Current due date: {currentDueDate}</Text>
          </>
        }
      />
    ),
  };
}
