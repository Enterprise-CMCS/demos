import { Document, Person } from "demos-server";

export type DeliverableFileRow = Pick<
  Document,
  "id" | "name" | "description" | "createdAt" | "isPartOfDeliverableSubmission" | "documentType"
> & {
  owner: { person: Pick<Person, "fullName"> };
};

