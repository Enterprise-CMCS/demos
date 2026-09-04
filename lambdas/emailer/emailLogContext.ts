export type RealtimeEmailEnvelope = {
  emailNotificationId?: string;
  emailType: string;
  entityType?: string;
  entityId?: string;
  idempotencyKey?: string;
  triggeredBy?: {
    type: string;
    id: string;
  };
  payload: unknown;
};

export function isRealtimeEmailEnvelope(
  email: unknown,
): email is RealtimeEmailEnvelope {
  return (
    typeof email === "object" &&
    email !== null &&
    typeof (email as RealtimeEmailEnvelope).emailType === "string" &&
    "payload" in email
  );
}

export function getEmailLogContext(
  email: RealtimeEmailEnvelope | undefined,
) {
  if (!email) {
    return {};
  }

  return {
    emailType: email.emailType,
    entityType: email.entityType,
    entityId: email.entityId,
    idempotencyKey: email.idempotencyKey,
    triggeredBy: email.triggeredBy,
  };
}
