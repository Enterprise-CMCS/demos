import React from "react";

import {
  Amendment,
  Demonstration,
  DemonstrationRoleAssignment,
  Document,
  Extension,
  Person,
} from "demos-server";
import { useLocation, useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { AmendmentsTab } from "./AmendmentsTab";
import { DemonstrationTab } from "./DemonstrationTab";
import { ExtensionsTab } from "./ExtensionsTab";
import { Tab, Tabs } from "layout/Tabs";
import { DemonstrationQueryResult } from "demos-server";

export const useDemonstration = (id?: string) => {
  const { data, loading, error } = useQuery<DemonstrationQueryResult>(
    GET_DEMONSTRATION_BY_ID_QUERY,
    {
      variables: { id: id! },
      skip: !id,
      fetchPolicy: "cache-first",
    }
  );

  const demonstration = data?.demonstration;

  const projectOfficer = (demonstration?.roles ?? []).find(
    (role) => role.role === "Project Officer" && role.isPrimary === true
  );

  return {
    demonstration,
    projectOfficer,
    loading,
    error,
  };
};


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
      status
      currentPhaseName
      amendments {
        id
      }
      extensions {
        id
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

export type DemonstrationDetail = Pick<Demonstration, "id" | "status" | "currentPhaseName"> & {
  amendments: Pick<Amendment, "id">[];
  extensions: Pick<Extension, "id">[];
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
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const amendmentParam = getQueryParamValue(queryParams, "amendment", "amendments");
  const extensionParam = getQueryParamValue(queryParams, "extension", "extensions");

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

            <Tab label={`Amendments (${demonstration.amendments?.length ?? 0})`} value="amendments">
              <AmendmentsTab
                demonstrationId={demonstration.id}
                initiallyExpandedId={amendmentParam ?? undefined}
              />
            </Tab>

            <Tab label={`Extensions (${demonstration.extensions?.length ?? 0})`} value="extensions">
              <ExtensionsTab
                demonstrationId={demonstration.id}
                initiallyExpandedId={extensionParam ?? undefined}
              />
            </Tab>
          </Tabs>
        </>
      }
    </div>
  );
};
