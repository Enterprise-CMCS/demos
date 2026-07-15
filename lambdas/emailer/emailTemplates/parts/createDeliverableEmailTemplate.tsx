import { formatDate, getRequiredValue } from "../EmailHelper";
import type { EmailRecipientGroups, EmailTemplateDefinition } from "../types";
import { DeliverableEmail } from "./DeliverableEmail";
import type { DeliverableEmailConfig, DeliverableEmailInput, DeliverableEmailProps } from "./types";

// TO BE SET IN A BETTER WAY SOON
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
      const deliverableId = getRequiredValue(
        input.deliverable?.id,
        "deliverable.id",
        config.id
      );

      return {
        demonstrationTitle: getRequiredValue(
          input.demonstration?.name,
          "demonstration.name",
          config.id
        ),
        state: getRequiredValue(
          input.demonstration?.stateId,
          "demonstration.stateId",
          config.id
        ),
        deliverableType: getRequiredValue(
          input.deliverable?.deliverableTypeId,
          "deliverable.deliverableTypeId",
          config.id
        ),
        deliverableName: getRequiredValue(
          input.deliverable?.name,
          "deliverable.name",
          config.id
        ),
        currentDueDate: formatDate(
          getRequiredValue(input.deliverable?.dueDate, "deliverable.dueDate", config.id)
        ),
        link: `${demosAppUrl}/deliverables/${deliverableId}`,
      };
    },
    getRecipients(input) {
      return getRequiredValue<EmailRecipientGroups>(input.recipients, "recipients", config.id);
    },
  };
}
