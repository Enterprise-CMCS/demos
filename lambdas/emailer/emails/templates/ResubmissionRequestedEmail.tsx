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

const emailType = "Resubmission Requested";

export function renderResubmissionRequestedEmail(
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
    subject: "CMS DEMOS Deliverable: Resubmission Requested",
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
            CMS has requested a resubmission for a {deliverableType} deliverable,
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
