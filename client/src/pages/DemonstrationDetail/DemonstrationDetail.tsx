import React, { useCallback, useMemo, useState } from "react";

import { isTestMode } from "config/env";
import { usePageHeader } from "hooks/usePageHeader";
import { Tabs } from "layout/Tabs";
import { DemonstrationDetailHeader } from "pages/DemonstrationDetail/DemonstrationDetailHeader";
import { useLocation, useParams } from "react-router-dom";

import { gql, useQuery } from "@apollo/client";

import { AmendmentsTab } from "./AmendmentsTab";
import { DemonstrationDetailModals } from "./DemonstrationDetailModals";
import { DemonstrationTab } from "./DemonstrationTab";
import { ExtensionsTab } from "./ExtensionsTab";
import { Demonstration as ServerDemonstration } from "demos-server";

export const DEMONSTRATION_DETAIL_QUERY = gql`
  query DemonstrationDetailQuery($demonstrationId: ID!) {
    demonstration(id: $demonstrationId) {
      id
      amendments {
        id
      }
      extensions {
        id
      }
    }
  }
`;

export type Demonstration = Pick<ServerDemonstration, "id"> & {
  amendments: [];
  extensions: [];
};

type TabType = "details" | "amendments" | "extensions";

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

  const { data, loading, error } = useQuery<{ demonstration: Demonstration }>(
    DEMONSTRATION_DETAIL_QUERY,
    {
      variables: { demonstrationId: id },
    }
  );

  const headerContent = useMemo(
    () => <DemonstrationDetailHeader onEdit={handleEdit} onDelete={handleDelete} />,
    [handleEdit, handleDelete]
  );
  usePageHeader(headerContent);

  if (error) {
    return <div>Error loading demonstration: {error.message}</div>;
  }
  if (loading) {
    return <div>Loading demonstration...</div>;
  }

  const demonstration = data?.demonstration;

  if (!demonstration) {
    return <div>No demonstration data found.</div>;
  }

  const tabList = [
    { value: "details", label: "Demonstration Details" },
    { value: "amendments", label: "Amendments", count: demonstration.amendments.length },
    { value: "extensions", label: "Extensions", count: demonstration.extensions.length },
  ];

  return (
    <div>
      {isTestMode() && headerContent}
      <>
        <Tabs
          tabs={tabList}
          selectedValue={tab}
          onChange={(newVal) => setTab(newVal as typeof tab)}
        />

        <div className="mt-4 h-[60vh] overflow-y-auto">
          {tab === "details" && <DemonstrationTab />}

          {tab === "amendments" && (
            <AmendmentsTab
              onClick={() => setEntityCreationModal("amendment")}
              initiallyExpandedId={amendmentParam ?? undefined}
            />
          )}

          {tab === "extensions" && (
            <ExtensionsTab
              onClick={() => setEntityCreationModal("extension")}
              initiallyExpandedId={extensionParam ?? undefined}
            />
          )}
        </div>
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
    </div>
  );
};
