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

const emailType = "Extension Requested";

export function renderExtensionRequestedEmail(
  rawPayload: unknown,
): EmailTemplateResult {
  const payload = getRequiredObject(rawPayload, "payload", emailType);
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
  const currentDueDate = formatDate(
    getRequiredString(deliverable.dueDate, "deliverable.dueDate", emailType),
  );
  const requestedDueDate = formatDate(
    getRequiredString(
      deliverable.requestedDueDate,
      "deliverable.requestedDueDate",
      emailType,
    ),
  );
  const link = `${getDemosAppUrl()}/deliverables/${getRequiredString(
    deliverable.id,
    "deliverable.id",
    emailType,
  )}`;

  return {
    subject: "CMS DEMOS Deliverable: Extension Requested",
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
            A state user has requested an extension for a {deliverableType}{" "}
            deliverable, originally due on {currentDueDate}.{" "}
            <DeliverableLink href={link} />
          </Text>
        }
        state={getRequiredString(
          demonstration.stateId,
          "demonstration.stateId",
          emailType,
        )}
        dateDetails={
          <>
            <Text style={detailStyle}>Current due date: {currentDueDate}</Text>
            <Text style={detailStyle}>Requested due date: {requestedDueDate}</Text>
          </>
        }
      />
    ),
  };
}
