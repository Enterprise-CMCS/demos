import { gql } from "graphql-tag";

export const onDemandReportSchema = gql`
  type Mutation {
    generateOnDemandReport(reportType: OnDemandReportType!): String!
      @auth(requires: ["Perform CMS Action"])
  }
`;
