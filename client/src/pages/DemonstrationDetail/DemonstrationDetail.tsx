import React, { useCallback, useMemo, useState } from "react";

import { isTestMode } from "config/env";
import { useDemonstrationDetail } from "hooks/demonstration/useDemonstrationDetail";
import { usePageHeader } from "hooks/usePageHeader";
import { TabItem, Tabs } from "layout/Tabs";
import { DemonstrationDetailHeader, DemonstrationHeaderDetails } from "pages/DemonstrationDetail/DemonstrationDetailHeader";
import { useLocation, useParams } from "react-router-dom";

import { AmendmentsTab } from "./AmendmentsTab";
import { DemonstrationDetailModals, DemonstrationModalDetails } from "./DemonstrationDetailModals";
import { DemonstrationTab } from "./DemonstrationTab";
import { ExtensionsTab } from "./ExtensionsTab";
import { AmendmentTableRow } from "components/table/tables/AmendmentTable";
import { ExtensionTableRow } from "components/table/tables/ExtensionTable";

export type DemonstrationDetail = DemonstrationHeaderDetails &
  DemonstrationModalDetails & {
    amendments: AmendmentTableRow[];
    extensions: ExtensionTableRow[];
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
  const [tab, setTab] = useState<TabType>(() => {
    const amendmentParam = getQueryParamValue(queryParams, "amendment", "amendments");
    const extensionParam = getQueryParamValue(queryParams, "extension", "extensions");

    if (amendmentParam === "true") return "amendments";
    if (extensionParam === "true") return "extensions";
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

  const { demonstration, loading, error } = useDemonstrationDetail(id);
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
            {tab === "details" && <DemonstrationTab />}

            {tab === "amendments" && (
              <AmendmentsTab
                amendments={demonstration.amendments || []}
                onClick={() => setEntityCreationModal("amendment")}
              />
            )}

            {tab === "extensions" && (
              <ExtensionsTab
                extensions={demonstration.extensions || []}
                onClick={() => setEntityCreationModal("extension")}
              />
            )}
          </div>
          {(entityCreationModal || demonstrationActionModal) && (
            <DemonstrationDetailModals
              entityCreationModal={entityCreationModal}
              demonstrationActionModal={demonstrationActionModal}
              demonstration={demonstration}
              onCloseEntityModal={() => setEntityCreationModal(null)}
              onCloseDemonstrationModal={() => setDemonstrationActionModal(null)}
            />
          )}
        </>
      )}
    </div>
  );
};
