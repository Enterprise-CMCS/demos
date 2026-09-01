import { log } from "../../log";
import { prisma } from "../../prismaClient";
import { enqueueTrackedRealtimeEmail } from "./emailNotification";

type NotifyReferenceAgreementRequestedInput = {
  referenceConfigurationId: string;
  triggeredByUserId: string;
  triggeredAt: Date;
};

export async function notifyReferenceAgreementRequested(
  input: NotifyReferenceAgreementRequestedInput,
): Promise<void> {
  try {
    const user = await prisma().user.findUniqueOrThrow({
      where: { id: input.triggeredByUserId },
      include: { person: true },
    });
    const address = user.person.email.trim();
    if (!address) {
      throw new Error(
        `Cannot queue Terms And Conditions Requested email: user ${input.triggeredByUserId} has no email address.`,
      );
    }

    const messageId = await enqueueTrackedRealtimeEmail(
      {
        emailType: "Terms And Conditions Requested",
        entityType: "reference",
        entityId: input.referenceConfigurationId,
        triggeredBy: {
          type: "realtime",
          id: input.triggeredByUserId,
        },
        triggeredAt: input.triggeredAt.toISOString(),
        idempotencyKey:
          "Terms And Conditions Requested:reference-agreement-acceptance:" +
          `${input.referenceConfigurationId}:${input.triggeredByUserId}:${input.triggeredAt.toISOString()}`,
        payload: {
          recipients: {
            to: [
              {
                name: `${user.person.firstName} ${user.person.lastName}`.trim(),
                address,
              },
            ],
          },
        },
      },
      undefined,
      [{ personId: user.person.id, emailAddress: address }],
    );

    log.info(
      {
        messageId,
        referenceConfigurationId: input.referenceConfigurationId,
        emailType: "Terms And Conditions Requested",
      },
      "Reference agreement email queued",
    );
  } catch (error) {
    log.error(
      {
        error,
        referenceConfigurationId: input.referenceConfigurationId,
        emailType: "Terms And Conditions Requested",
      },
      "Failed to queue reference agreement email",
    );
  }
}
