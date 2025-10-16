import React, { useCallback, useMemo, useState } from "react";

import { ModificationTableRow } from "components/table/tables/ModificationTable";
import { isTestMode } from "config/env";
import { Document, Person } from "demos-server";
import { usePageHeader } from "hooks/usePageHeader";
import {
  DemonstrationDetailHeader,
  DemonstrationHeaderDetails,
} from "pages/DemonstrationDetail/DemonstrationDetailHeader";
import { useLocation, useParams } from "react-router-dom";

import { gql, useQuery } from "@apollo/client";

import { AmendmentsTab } from "./AmendmentsTab";
import { DemonstrationDetailModals } from "./DemonstrationDetailModals";
import { DemonstrationTab, DemonstrationTabDemonstration } from "./DemonstrationTab";
import { ExtensionsTab } from "./ExtensionsTab";
import { Tab, Tabs } from "layout/Tabs";

export const DEMONSTRATION_DETAIL_QUERY = gql`
  query DemonstrationDetailQuery($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      effectiveDate
      expirationDate
      sdgDivision
      signatureLevel
      state {
        id
        name
      }
      status
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
        createdAt
        owner {
          person {
            fullName
          }
        }
      }
      roles {
        isPrimary
        role
        person {
          id
          fullName
          email
        }
      }
      currentPhaseName
      primaryProjectOfficer {
        id
        fullName
      }
    }
  }
`;

export type DemonstrationDetail = DemonstrationHeaderDetails &
  DemonstrationTabDemonstration & {
    amendments: ModificationTableRow[];
    extensions: ModificationTableRow[];
  } & {
    documents: (Pick<Document, "id" | "name" | "description" | "documentType" | "createdAt"> & {
      owner: { person: Pick<Person, "fullName"> };
    })[];
  };

type EntityCreationModal = "amendment" | "extension" | "document" | null;
type DemonstrationActionModal = "edit" | "delete" | null;

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
  const [demonstrationActionModal, setDemonstrationActionModal] =
    useState<DemonstrationActionModal>(null);

  const handleEdit = useCallback(() => {
    setDemonstrationActionModal("edit");
  }, []);
  const handleDelete = useCallback(() => {
    setDemonstrationActionModal("delete");
  }, []);

  const { data, loading, error } = useQuery<{ demonstration: DemonstrationDetail }>(
    DEMONSTRATION_DETAIL_QUERY,
    {
      variables: { id: id! },
      skip: !id,
    }
  );

  const demonstration = data?.demonstration;

  const headerContent = useMemo(
    () => (
      <DemonstrationDetailHeader
        demonstration={demonstration}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    ),
    [demonstration, loading, error, handleEdit, handleDelete]
  );
  usePageHeader(headerContent);

  return (
    <div>
      {isTestMode() && headerContent}

      {loading && <p>Loading...</p>}
      {error && <p>Error loading demonstration</p>}

      {demonstration && (
        <>
          <Tabs
            defaultValue={amendmentParam ? "amendments" : extensionParam ? "extensions" : "details"}
          >
            <Tab label="Demonstration Details" value="details">
              <DemonstrationTab demonstration={demonstration} />
            </Tab>

            <Tab label={`Amendments (${demonstration.amendments?.length ?? 0})`} value="amendments">
              <AmendmentsTab
                amendments={demonstration.amendments || []}
                onClick={() => setEntityCreationModal("amendment")}
                initiallyExpandedId={amendmentParam ?? undefined}
              />
            </Tab>

            <Tab label={`Extensions (${demonstration.extensions?.length ?? 0})`} value="extensions">
              <ExtensionsTab
                extensions={demonstration.extensions || []}
                onClick={() => setEntityCreationModal("extension")}
                initiallyExpandedId={extensionParam ?? undefined}
              />
            </Tab>
          </Tabs>

          {(entityCreationModal || demonstrationActionModal) && (
            <DemonstrationDetailModals
              entityCreationModal={entityCreationModal}
              demonstrationActionModal={demonstrationActionModal}
              demonstrationId={demonstration.id}
              onCloseEntityModal={() => setEntityCreationModal(null)}
              onCloseDemonstrationDialog={() => setDemonstrationActionModal(null)}
            />
          )}
        </>
      )}
    </div>
  );
};
