import React, { useCallback, useMemo, useState } from "react";

import { ModificationTableRow } from "components/table/tables/ModificationTable";
import { isTestMode } from "config/env";
import { usePageHeader } from "hooks/usePageHeader";
import { TabItem, Tabs } from "layout/Tabs";
import {
  DemonstrationDetailHeader,
  DemonstrationHeaderDetails,
} from "pages/DemonstrationDetail/DemonstrationDetailHeader";
import { useLocation, useParams } from "react-router-dom";

import { gql, useQuery } from "@apollo/client";

import { AmendmentsTab } from "./AmendmentsTab";
import { DemonstrationDetailModals, DemonstrationDialogDetails } from "./DemonstrationDetailModals";
import { DemonstrationTab, DemonstrationTabDemonstration } from "./DemonstrationTab";
import { ExtensionsTab } from "./ExtensionsTab";
import { Contact, User } from "demos-server";

export const DEMONSTRATION_DETAIL_QUERY = gql`
  query DemonstrationDetailQuery($id: ID!) {
    demonstration(id: $id) {
      id
      name
      description
      effectiveDate
      expirationDate
      state {
        id
        name
      }
      demonstrationStatus {
        name
      }
      projectOfficer {
        fullName
      }
      amendments {
        id
        name
        effectiveDate
        status: amendmentStatus {
          name
        }
      }
      extensions {
        id
        name
        effectiveDate
        status: extensionStatus {
          name
        }
      }
      demonstrationTypes {
        id
      }
      documents {
        id
      }
      contacts {
        contactType
        user {
          fullName
          email
        }
      }
    }
  }
`;

export type ContactType =
  | "Primary Project Officer"
  | "Secondary Project Officer"
  | "State Representative"
  | "Subject Matter Expert";

export type DemonstrationDetail = DemonstrationHeaderDetails &
  DemonstrationDialogDetails &
  DemonstrationTabDemonstration & {
    amendments: ModificationTableRow[];
    extensions: ModificationTableRow[];
  } & {
    contacts: (Pick<Contact, "contactType"> & {
      user: Pick<User, "fullName" | "email">;
    })[];
  };

type TabType = "details" | "amendments" | "extensions";

type EntityCreationModal = "amendment" | "extension" | "document" | null;
type DemonstrationActionModal = "edit" | "delete" | null;

const createTabList = (amendmentCount: number, extensionCount: number): TabItem[] => [
  { value: "details", label: "Demonstration Details" },
  { value: "amendments", label: "Amendments", count: amendmentCount },
  { value: "extensions", label: "Extensions", count: extensionCount },
];

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

  const [tab, setTab] = useState<TabType>(() => {
    if (amendmentParam) return "amendments";
    if (extensionParam) return "extensions";
    return "details";
  });
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

  const tabList = useMemo(
    () =>
      createTabList(demonstration?.amendments.length ?? 0, demonstration?.extensions.length ?? 0),
    [demonstration]
  );

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
            tabs={tabList}
            selectedValue={tab}
            onChange={(newVal) => setTab(newVal as typeof tab)}
          />

          <div className="mt-4 h-[60vh] overflow-y-auto">
            {tab === "details" && <DemonstrationTab demonstration={demonstration} />}

            {tab === "amendments" && (
              <AmendmentsTab
                amendments={demonstration.amendments || []}
                onClick={() => setEntityCreationModal("amendment")}
                initiallyExpandedId={amendmentParam ?? undefined}
              />
            )}

            {tab === "extensions" && (
              <ExtensionsTab
                extensions={demonstration.extensions || []}
                onClick={() => setEntityCreationModal("extension")}
                initiallyExpandedId={extensionParam ?? undefined}
              />
            )}
          </div>
          {(entityCreationModal || demonstrationActionModal) && (
            <DemonstrationDetailModals
              entityCreationModal={entityCreationModal}
              demonstrationActionModal={demonstrationActionModal}
              demonstration={demonstration}
              onCloseEntityModal={() => setEntityCreationModal(null)}
              onCloseDemonstrationDialog={() => setDemonstrationActionModal(null)}
            />
          )}
        </>
      )}
    </div>
  );
};
