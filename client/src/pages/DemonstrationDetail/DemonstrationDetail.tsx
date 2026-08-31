import React from "react";

import {
  Amendment,
  Deliverable,
  Demonstration,
  DemonstrationRoleAssignment,
  DemonstrationTypeAssignment,
  Document,
  Person,
  State,
  Tag,
} from "demos-server";
import { useLocation, useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { AmendmentsTab } from "./modifications/AmendmentsTab";
import { DemonstrationTab } from "./DemonstrationTab";
import { RenewalsTab } from "./modifications/RenewalsTab";
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
      renewals: extensions {
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
      deliverables {
        id
        demonstrationTypes {
          tagName
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
  renewals: DemonstrationDetailModification[];
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
  deliverables?: (Pick<Deliverable, "id"> & {
    demonstrationTypes: Pick<Tag, "tagName">[];
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
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const amendmentParam = getQueryParamValue(queryParams, "amendment", "amendments");
  const renewalParam = getQueryParamValue(queryParams, "renewal", "renewals");

  const { data, loading, error } = useQuery<{ demonstration: DemonstrationDetail }>(
    DEMONSTRATION_DETAIL_QUERY,
    {
      variables: { id: id },
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
  const renewalCount = demonstration.renewals?.length ?? 0;
  const isApproved = demonstration.status === "Approved";
  return (
    <div>
      {
        <>
          <Tabs
            defaultValue={amendmentParam ? "amendments" : renewalParam ? "renewals" : "details"}
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
              label={`Renewals (${renewalCount})`}
              value="renewals"
              shouldRender={isApproved || renewalCount > 0}
            >
              <RenewalsTab
                demonstrationId={demonstration.id}
                medicaidId={demonstration.medicaidId}
                renewals={demonstration.renewals}
                selectedRenewalId={renewalParam || undefined}
                canCreateModifications={isApproved}
              />
            </Tab>
          </Tabs>
        </>
      }
    </div>
  );
};
