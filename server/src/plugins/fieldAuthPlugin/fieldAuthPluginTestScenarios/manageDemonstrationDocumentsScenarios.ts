import { gql } from "graphql-tag";
import { DocumentNode } from "graphql";

export type FeatureTestScenario = {
  description: string;
  document: DocumentNode;
  allowedRoles: string[];
  deniedRoles: string[];
};

/*
Feature: Manage Demonstration Documents

Scenario requirements from ticket:

    Given I am logged in as an Admin or CMS User,
    When I navigate to the Documents Tab of a Demonstration,
    Then I should see a list of documents including: Document Title, Description, Document Type, Uploaded By, Date Uploaded, and a View button to access the file.

    Given I am logged in as an Admin or CMS User,
    When I select "Add Document,"
    Then I should be able to enter: Document Title, Description, Document Type, and upload a file.

    Given I am logged in as an Admin or CMS User,
    When I select an existing document,
    Then I should be able to edit the Title, Description, and Document Type, or remove the document entirely.

    Given I am logged in as a State User,
    When I navigate to a Demonstration record,
    Then I should not have access to view or manage the Documents Tab.
*/

export const manageDemonstrationDocumentsScenarios: FeatureTestScenario[] = [
  {
    description: "query document",
    document: gql`
      query ViewDemonstrationDocuments($id: ID!) {
        demonstration(id: $id) {
          id
          documents {
            id
            title
            description
            documentType
            createdAt
            owner {
              person {
                fullName
              }
            }
          }
        }
      }
    `,
    allowedRoles: ["Admin User", "CMS User", "Read-Only CMS User"],
    deniedRoles: ["State User"],
  },
  {
    description: "add document to demonstration (mutation)",
    document: gql`
      mutation AddDemonstrationDocument($input: UploadDocumentInput!) {
        uploadDocument(input: $input) {
          id
          title
        }
      }
    `,
    allowedRoles: ["Admin User", "CMS User"],
    deniedRoles: ["Read-Only CMS User", "State User"],
  },
  {
    description: "download document from demonstration",
    document: gql`
      query DownloadDemonstrationDocument($id: ID!) {
        document(id: $id) {
          id
          downloadUrl
        }
      }
    `,
    allowedRoles: ["Admin User", "CMS User", "Read-Only CMS User"],
    deniedRoles: ["State User"],
  },
  {
    description: "delete document from demonstration (mutation)",
    document: gql`
      mutation DeleteDemonstrationDocument($id: ID!) {
        deleteDocument(id: $id) {
          id
        }
      }
    `,
    allowedRoles: ["Admin User", "CMS User"],
    deniedRoles: ["Read-Only CMS User", "State User"],
  },
];
