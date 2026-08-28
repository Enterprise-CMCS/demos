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

const emailType = "Extension Decision Made";

export function renderExtensionDecisionMadeEmail(
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
  const extensionDecision = getRequiredString(
    deliverable.extensionDecision,
    "deliverable.extensionDecision",
    emailType,
  );
  if (
    extensionDecision !== "Approved" &&
    extensionDecision !== "Denied"
  ) {
    throw new Error(
      `Invalid value for deliverable.extensionDecision while rendering ${emailType}.data: expected Approved or Denied.`,
    );
  }
  const link = `${getDemosAppUrl()}/deliverables/${getRequiredString(
    deliverable.id,
    "deliverable.id",
    emailType,
  )}`;

  return {
    subject: "CMS DEMOS Deliverable: Extension Decision Made",
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
            CMS has {extensionDecision} an extension request for your{" "}
            {deliverableType} deliverable. The current due date is {currentDueDate}.{" "}
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
            <Text style={detailStyle}>Previous due date: {previousDueDate}</Text>
            <Text style={detailStyle}>Current due date: {currentDueDate}</Text>
          </>
        }
      />
    ),
  };
}
