import { gql } from "graphql-tag";

export const deliverableSchema = gql`
  type Deliverable {
    id: ID!
  }
`;

export interface Deliverable {
  id: string;
}
