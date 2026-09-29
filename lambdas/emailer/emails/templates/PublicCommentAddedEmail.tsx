import { PublicComment } from "../components/deliverable/PublicComment";
import { getDemosAppUrl, getRequiredObject, getRequiredString } from "../helpers";
import type { EmailTemplateResult } from "../types";

const emailType = "Deliverable Comment";

export function renderPublicCommentAddedEmail(rawPayload: unknown): EmailTemplateResult {
  const payload = getRequiredObject(rawPayload, "payload", emailType);
  const demonstration = getRequiredObject(payload.demonstration, "demonstration", emailType);
  const deliverable = getRequiredObject(payload.deliverable, "deliverable", emailType);
  const deliverableType = getRequiredString(
    deliverable.deliverableTypeId,
    "deliverable.deliverableTypeId",
    emailType
  );
  const link = `${getDemosAppUrl()}/deliverables/${getRequiredString(
    deliverable.id,
    "deliverable.id",
    emailType
  )}`;

  return {
    subject: "CMS DEMOS Deliverable: New Comment",
    content: (
      <PublicComment
        demonstrationTitle={getRequiredString(demonstration.name, "demonstration.name", emailType)}
        deliverableName={getRequiredString(deliverable.name, "deliverable.name", emailType)}
        deliverableType={deliverableType}
        link={link}
        state={getRequiredString(demonstration.stateName, "demonstration.stateName", emailType)}
      />
    ),
  };
}
