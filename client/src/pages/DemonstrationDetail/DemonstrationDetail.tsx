import React from "react";

import {
  Amendment,
  Demonstration,
  DemonstrationRoleAssignment,
  DemonstrationTypeAssignment,
  Document,
  Person,
  State,
} from "demos-server";
import { useLocation, useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { AmendmentsTab } from "./modifications/AmendmentsTab";
import { DemonstrationTab } from "./DemonstrationTab";
import { ExtensionsTab } from "./modifications/ExtensionsTab";
import { Tab, Tabs } from "layout/Tabs";

export const GET_DEMONSTRATION_BY_ID_QUERY = gql`
  query GetDemonstrationById($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      state {
        id
        name
      }
      roles {
        isPrimary
        role
        person {
          id
          fullName
        }
      }
    }
  }
`;

export const DEMONSTRATION_DETAIL_QUERY = gql`
  query DemonstrationDetailQuery($id: ID!) {
    demonstration(id: $id) {
      id
      name
      status
      currentPhaseName
      effectiveDate
      expirationDate
      medicaidId
      state {
        id
      }
      amendments {
        name
        id
        description
        status
        createdAt
        effectiveDate
        signatureLevel
        documents {
          id
          name
          description
          documentType
          phaseName
          createdAt
          owner {
            person {
              fullName
            }
          }
        }
      }
      extensions {
        id
        name
        description
        status
        createdAt
        effectiveDate
        signatureLevel
        documents {
          id
          name
          description
          documentType
          phaseName
          createdAt
          owner {
            person {
              fullName
            }
          }
        }
      }
      demonstrationTypes {
        demonstrationTypeName
        status
        approvalStatus
        effectiveDate
        expirationDate
        createdAt
      }
      documents {
        id
        name
        description
        documentType
        phaseName
        createdAt
        owner {
          person {
            fullName
          }
        }
      }
      roles {
        role
        isPrimary
        person {
          id
          fullName
          email
          personType
        }
      }
    }
  }
`;

export type DemonstrationDetailModification = Pick<
  Amendment,
  "id" | "name" | "description" | "status" | "createdAt" | "effectiveDate" | "signatureLevel"
> & {
  documents: (Pick<Document, "id" | "name" | "description" | "documentType" | "createdAt"> & {
    owner: { person: Pick<Person, "fullName"> };
  })[];
};
export type DemonstrationDetail = Pick<
  Demonstration,
  "id" | "name" | "status" | "currentPhaseName" | "effectiveDate" | "expirationDate" | "medicaidId"
> & {
  state: Pick<State, "id">;
  amendments: DemonstrationDetailModification[];
  extensions: DemonstrationDetailModification[];
  demonstrationTypes: Pick<
    DemonstrationTypeAssignment,
    | "demonstrationTypeName"
    | "status"
    | "effectiveDate"
    | "expirationDate"
    | "createdAt"
    | "approvalStatus"
  >[];
  documents: (Pick<Document, "id" | "name" | "description" | "documentType" | "createdAt"> & {
    owner: { person: Pick<Person, "fullName"> };
  })[];
  roles: (Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
    person: Pick<Person, "id" | "fullName" | "email" | "personType">;
  })[];
};

const getQueryParamValue = (
  searchParams: URLSearchParams,
  singular: string,
  plural: string
): string | null => {
  return searchParams.get(plural) || searchParams.get(singular);
};

export const DemonstrationDetail: React.FC = () => {
  const { id: demonstrationId } = useParams<{ id?: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const amendmentParam = getQueryParamValue(queryParams, "amendment", "amendments");
  const extensionParam = getQueryParamValue(queryParams, "extension", "extensions");

  if (!demonstrationId) {
    throw new Error("DemonstrationDetail requires route param id.");
  }

  const { data, loading, error } = useQuery<{ demonstration: DemonstrationDetail }>(
    DEMONSTRATION_DETAIL_QUERY,
    {
      variables: { id: demonstrationId },
    }
  );

  const demonstration = data?.demonstration;

  if (loading) {
    return <div>Loading demonstration...</div>;
  }

  if (error || !demonstration) {
    return <div>Failed to load demonstration.</div>;
  }

  const amendmentCount = demonstration.amendments?.length ?? 0;
  const extensionCount = demonstration.extensions?.length ?? 0;
  const isApproved = demonstration.status === "Approved";
  return (
    <div>
      {
        <>
          <Tabs
            defaultValue={amendmentParam ? "amendments" : extensionParam ? "extensions" : "details"}
          >
            <Tab label="Demonstration Details" value="details">
              <DemonstrationTab demonstration={demonstration} />
            </Tab>

            <Tab
              label={`Amendments (${amendmentCount})`}
              value="amendments"
              shouldRender={isApproved || amendmentCount > 0}
            >
              <AmendmentsTab
                demonstrationId={demonstration.id}
                medicaidId={demonstration.medicaidId}
                amendments={demonstration.amendments}
                selectedAmendmentId={amendmentParam || undefined}
                canCreateModifications={isApproved}
              />
            </Tab>

            <Tab
              label={`Extensions (${extensionCount})`}
              value="extensions"
              shouldRender={isApproved || extensionCount > 0}
            >
              <ExtensionsTab
                demonstrationId={demonstration.id}
                medicaidId={demonstration.medicaidId}
                extensions={demonstration.extensions}
                selectedExtensionId={extensionParam || undefined}
                canCreateModifications={isApproved}
              />
            </Tab>
          </Tabs>
        </>
      }
    </div>
  );
};
