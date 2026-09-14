import { Link, Text } from "@react-email/components";

import { DeliverableEmailLayout } from "../components/DeliverableEmailLayout";
import { detailStyle, textStyle } from "../components/styles";
import {
  formatDate,
  getDemosAppUrl,
  getRequiredObject,
  getRequiredString,
} from "../helpers";
import type { EmailTemplateResult } from "../types";

const emailType = "Deliverable Comment";

export function renderPublicCommentAddedEmail(
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
  const link = `${getDemosAppUrl()}/deliverables/${getRequiredString(
    deliverable.id,
    "deliverable.id",
    emailType,
  )}`;

  return {
    subject: "CMS DEMOS Deliverable: New Comment",
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
            A new comment has been added to a {deliverableType} deliverable.{" "}
            View this deliverable and the full comment thread in the DEMOS system:{" "}
            <Link href={link}>{link}</Link>.
          </Text>
        }
        state={getRequiredString(
          demonstration.stateId,
          "demonstration.stateId",
          emailType,
        )}
        dateDetails={
          <Text style={detailStyle}>Current due date: {currentDueDate}</Text>
        }
      />
    ),
  };
}
