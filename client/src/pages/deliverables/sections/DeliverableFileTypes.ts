import { Document, DocumentType, Person } from "demos-server";

export type DeliverableFileRow = Pick<Document, "id" | "name" | "description" | "createdAt"> & {
  documentType: DocumentType;
  owner: { person: Pick<Person, "fullName"> };
};
