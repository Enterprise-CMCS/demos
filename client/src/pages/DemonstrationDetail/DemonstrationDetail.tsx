import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { isTestMode } from "config/env";
import { useDemonstration } from "hooks/useDemonstration";
import { usePageHeader } from "hooks/usePageHeader";
import {
  TabItem,
  Tabs,
} from "layout/Tabs";
import { mockAmendments } from "mock-data/amendmentMocks";
import { mockExtensions } from "mock-data/extensionMocks";
import { DemonstrationDetailHeader } from "pages/DemonstrationDetail/DemonstrationDetailHeader";
import {
  useLocation,
  useParams,
} from "react-router-dom";

import { AmendmentsTab } from "./AmendmentsTab";
import { DemonstrationDetailModals } from "./DemonstrationDetailModals";
import { DemonstrationTab } from "./DemonstrationTab";
import { ExtensionsTab } from "./ExtensionsTab";

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
  const [entityCreationModal, setEntityCreationModal] = useState<EntityCreationModal>(null);
  const [demonstrationActionModal, setDemonstrationActionModal] =
    useState<DemonstrationActionModal>(null);

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

  const { getDemonstrationById } = useDemonstration();
  const { trigger, data: demonstration, loading, error } = getDemonstrationById;

  const tabList = useMemo(() => createTabList(mockAmendments.length, mockExtensions.length), []);

  useEffect(() => {
    if (id) trigger(id);
  }, [id]);

  const handleEdit = useCallback(() => {
    setDemonstrationActionModal("edit");
  }, []);

  const handleDelete = useCallback(() => {
    setDemonstrationActionModal("delete");
  }, []);

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
                demonstration={demonstration}
                onClick={() => setEntityCreationModal("amendment")}
                initiallyExpandedId={amendmentParam ?? undefined}
              />
            )}

            {tab === "extensions" && (
              <ExtensionsTab
                demonstration={demonstration}
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
              onCloseDemonstrationModal={() => setDemonstrationActionModal(null)}
            />
          )}
        </>
      )}
    </div>
  );
};
