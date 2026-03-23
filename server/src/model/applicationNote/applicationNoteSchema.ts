import { gql } from "graphql-tag";
import { NoteType } from "../../types";

export const applicationNoteSchema = gql`
  type ApplicationNote {
    noteType: NoteType! @auth(requires: "Resolve ApplicationNote")
    content: String! @auth(requires: "Resolve ApplicationNote")
    createdAt: DateTime! @auth(requires: "Resolve ApplicationNote")
    updatedAt: DateTime! @auth(requires: "Resolve ApplicationNote")
  }

  input ApplicationNoteInput {
    noteType: NoteType!
    content: String
  }

  input SetApplicationNotesInput {
    applicationId: ID!
    applicationNotes: [ApplicationNoteInput!]!
  }

  type Mutation {
    setApplicationNotes(input: SetApplicationNotesInput): Application
      @auth(requires: "Mutate Application Workflow")
  }
`;

export type ApplicationNoteInput = {
  noteType: NoteType;
  content: string | null;
};

export interface SetApplicationNotesInput {
  applicationId: string;
  applicationNotes: ApplicationNoteInput[];
}

export interface ApplicationNote {
  noteType: NoteType;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
