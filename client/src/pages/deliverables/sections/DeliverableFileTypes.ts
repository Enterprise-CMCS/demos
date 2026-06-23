import { DeliverableAction, Document, Person } from "demos-server";

export type DeliverableFileRow = Pick<
  Document,
  "id" | "name" | "description" | "createdAt" | "documentType"
> & {
  deliverableSubmissionAction: Pick<DeliverableAction, "actionTimestamp"> | null;
  owner: { person: Pick<Person, "fullName"> };
};

