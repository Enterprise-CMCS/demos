import React, { useState } from "react";

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
import { AddDocumentDialog } from "components/dialog";

export const DEMONSTRATION_DETAIL_QUERY = gql`
  query DemonstrationDetailQuery($id: ID!) {
    demonstration(id: $id) {
      id
      status
      currentPhaseName
      amendments {
        id
        name
        effectiveDate
        status
      }
      extensions {
        id
        name
        effectiveDate
        status
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
        }
      }
    }
  }
`;

export type DemonstrationDetail = Pick<Demonstration, "id" | "status" | "currentPhaseName"> & {
  amendments: Pick<Amendment, "id" | "name" | "effectiveDate" | "status">[];
  extensions: Pick<Extension, "id" | "name" | "effectiveDate" | "status">[];
  documents: (Pick<Document, "id" | "name" | "description" | "documentType" | "createdAt"> & {
    owner: { person: Pick<Person, "fullName"> };
  })[];
  roles: (Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
    person: Pick<Person, "id" | "fullName" | "email">;
  })[];
};

type EntityCreationModal = "amendment" | "extension" | "document" | null;

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

  const [entityCreationModal, setEntityCreationModal] = useState<EntityCreationModal>(null);

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
                amendments={demonstration.amendments || []}
                initiallyExpandedId={amendmentParam ?? undefined}
              />
            </Tab>

            <Tab label={`Extensions (${demonstration.extensions?.length ?? 0})`} value="extensions">
              <ExtensionsTab
                demonstrationId={demonstration.id}
                extensions={demonstration.extensions || []}
                initiallyExpandedId={extensionParam ?? undefined}
              />
            </Tab>
          </Tabs>

          {entityCreationModal === "document" && (
            <AddDocumentDialog
              isOpen={true}
              onClose={() => setEntityCreationModal(null)}
              applicationId={demonstration.id}
            />
          )}
        </>
      }
    </div>
  );
};
