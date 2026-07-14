import { formatDate } from "../formatDate";
import { getRequiredValue } from "../getRequiredValue";
import { read } from "../read";
import type { EmailRecipientGroups, EmailTemplateDefinition } from "../types";
import { DeliverableEmail } from "./DeliverableEmail";
import type { DeliverableEmailConfig, DeliverableEmailInput, DeliverableEmailProps } from "./types";

const demosAppUrl = "http://localhost:3000";

export function createDeliverableEmailTemplate(
  config: DeliverableEmailConfig
): EmailTemplateDefinition<DeliverableEmailProps, DeliverableEmailInput> {
  const Component = (props: DeliverableEmailProps) => {
    const Message = config.Message;

    return (
      <DeliverableEmail {...props} action={config.action}>
        <Message {...props} />
      </DeliverableEmail>
    );
  };

  return {
    id: config.id,
    subject: `CMS DEMOS Deliverable: ${config.action}`,
    Component,
    getProps(input) {
      const deliverableId = read(input, "deliverable.id", config.id);

      return {
        demonstrationTitle: read(input, "demonstration.name", config.id),
        state: read(input, "demonstration.stateId", config.id),
        deliverableType: read(input, "deliverable.deliverableTypeId", config.id),
        deliverableName: read(input, "deliverable.name", config.id),
        currentDueDate: formatDate(read(input, "deliverable.dueDate", config.id)),
        link: `${demosAppUrl}/deliverables/${deliverableId}`,
      };
    },
    getRecipients(input) {
      return getRequiredValue(input, "recipients", config.id, "data") as EmailRecipientGroups;
    },
  };
}
