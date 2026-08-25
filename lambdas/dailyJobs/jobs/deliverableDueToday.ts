import type { QueryResultRow } from "pg";

import { getDbSchema } from "../db";
import { enqueueTrackedEmail, type TrackedEmailRecipient } from "../trackedEmail";
import type { DailyJob, DailyJobContext, DailyJobResult } from "../types";

const JOB_ID = "deliverable-due-today";
const EMAIL_TYPE = "Deliverable Due Today";

type DueDeliverableRow = QueryResultRow & {
  deliverable_id: string;
  deliverable_name: string;
  deliverable_type_id: string;
  deliverable_status_id: string;
  demonstration_id: string;
  demonstration_name: string;
  state_id: string;
  owner_person_id: string;
  owner_first_name: string;
  owner_last_name: string;
  owner_email: string;
  contact_person_id: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
};

type RawRecipient = {
  personId: string;
  firstName: string;
  lastName: string;
  email: string;
};

type DueDeliverable = {
  id: string;
  name: string;
  deliverableTypeId: string;
  statusId: string;
  demonstration: {
    id: string;
    name: string;
    stateId: string;
  };
  recipients: RawRecipient[];
};

function groupDueDeliverables(rows: DueDeliverableRow[]): DueDeliverable[] {
  const deliverables = new Map<string, DueDeliverable>();

  for (const row of rows) {
    let deliverable = deliverables.get(row.deliverable_id);
    if (!deliverable) {
      deliverable = {
        id: row.deliverable_id,
        name: row.deliverable_name,
        deliverableTypeId: row.deliverable_type_id,
        statusId: row.deliverable_status_id,
        demonstration: {
          id: row.demonstration_id,
          name: row.demonstration_name,
          stateId: row.state_id,
        },
        recipients: [
          {
            personId: row.owner_person_id,
            firstName: row.owner_first_name,
            lastName: row.owner_last_name,
            email: row.owner_email,
          },
        ],
      };
      deliverables.set(row.deliverable_id, deliverable);
    }

    if (row.contact_person_id) {
      deliverable.recipients.push({
        personId: row.contact_person_id,
        firstName: row.contact_first_name ?? "",
        lastName: row.contact_last_name ?? "",
        email: row.contact_email ?? "",
      });
    }
  }

  return Array.from(deliverables.values());
}

function resolveRecipients(deliverable: DueDeliverable): TrackedEmailRecipient[] {
  const recipients = new Map<string, TrackedEmailRecipient>();

  for (const person of deliverable.recipients) {
    const address = person.email.trim();
    if (!address) {
      throw new Error(
        `Cannot dispatch ${EMAIL_TYPE} email for deliverable ${deliverable.id}: ` +
          `person ${person.personId} has no email address.`
      );
    }

    const normalizedAddress = address.toLowerCase();
    if (!recipients.has(normalizedAddress)) {
      recipients.set(normalizedAddress, {
        personId: person.personId,
        name: `${person.firstName} ${person.lastName}`.trim(),
        address,
      });
    }
  }

  return Array.from(recipients.values());
}

async function selectDueDeliverables(context: DailyJobContext): Promise<DueDeliverable[]> {
  const schema = getDbSchema();
  const result = await context.pool.query<DueDeliverableRow>(
    `SELECT
       d.id AS deliverable_id,
       d.name AS deliverable_name,
       d.deliverable_type_id,
       d.status_id AS deliverable_status_id,
       demonstration.id AS demonstration_id,
       demonstration.name AS demonstration_name,
       demonstration.state_id,
       owner_person.id AS owner_person_id,
       owner_person.first_name AS owner_first_name,
       owner_person.last_name AS owner_last_name,
       owner_person.email AS owner_email,
       contact_person.id AS contact_person_id,
       contact_person.first_name AS contact_first_name,
       contact_person.last_name AS contact_last_name,
       contact_person.email AS contact_email
     FROM ${schema}.deliverable d
     JOIN ${schema}.demonstration demonstration
       ON demonstration.id = d.demonstration_id
      AND demonstration.status_id = d.demonstration_status_id
     JOIN ${schema}.users owner_user
       ON owner_user.id = d.cms_owner_user_id
      AND owner_user.person_type_id = d.cms_owner_person_type_id
     JOIN ${schema}.person owner_person
       ON owner_person.id = owner_user.id
      AND owner_person.person_type_id = owner_user.person_type_id
     LEFT JOIN ${schema}.demonstration_role_assignment role_assignment
       ON role_assignment.demonstration_id = demonstration.id
     LEFT JOIN ${schema}.person contact_person
       ON contact_person.id = role_assignment.person_id
      AND contact_person.person_type_id = role_assignment.person_type_id
     WHERE d.due_date >= ($1::DATE::TIMESTAMP AT TIME ZONE 'America/New_York')
       AND d.due_date < (($1::DATE + 1)::TIMESTAMP AT TIME ZONE 'America/New_York')
     ORDER BY d.id, contact_person.id`,
    [context.easternDate]
  );

  return groupDueDeliverables(result.rows);
}

export const deliverableDueTodayJob: DailyJob = {
  id: JOB_ID,
  async run(context): Promise<DailyJobResult> {
    const deliverables = await selectDueDeliverables(context);
    const result: DailyJobResult = {
      processed: deliverables.length,
      succeeded: 0,
      failed: 0,
      skipped: 0,
    };

    for (const deliverable of deliverables) {
      const idempotencyKey = `${EMAIL_TYPE}:deliverable:${deliverable.id}:${context.easternDate}`;

      try {
        const recipients = resolveRecipients(deliverable);
        const enqueueResult = await enqueueTrackedEmail(context.pool, {
          emailType: EMAIL_TYPE,
          entityType: "deliverable",
          entityId: deliverable.id,
          idempotencyKey,
          scheduledAt: context.scheduledAt,
          jobId: JOB_ID,
          recipients,
          payload: {
            recipients: {
              to: [],
              bcc: recipients.map(({ name, address }) => ({ name, address })),
            },
            demonstration: deliverable.demonstration,
            deliverable: {
              id: deliverable.id,
              name: deliverable.name,
              deliverableTypeId: deliverable.deliverableTypeId,
              dueDate: context.easternDate,
              statusId: deliverable.statusId,
            },
          },
        });

        if (enqueueResult === "skipped") {
          result.skipped += 1;
          context.logger.info(
            { jobId: JOB_ID, deliverableId: deliverable.id, idempotencyKey },
            "Daily job email already tracked; skipping"
          );
        } else {
          result.succeeded += 1;
          context.logger.info(
            { jobId: JOB_ID, deliverableId: deliverable.id, idempotencyKey },
            "Daily job email queued"
          );
        }
      } catch (error) {
        result.failed += 1;
        context.logger.error(
          { error, jobId: JOB_ID, deliverableId: deliverable.id, idempotencyKey },
          "Daily job item failed"
        );
      }
    }

    return result;
  },
};
