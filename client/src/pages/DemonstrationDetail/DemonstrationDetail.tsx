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

type ModalType = "edit" | "delete" | "amendment" | "extension" | "document" | null;
type TabType = "details" | "amendments" | "extensions";

// Create tab list with dynamic counts
const createTabList = (amendmentCount: number, extensionCount: number): TabItem[] => [
  { value: "details", label: "Demonstration Details" },
  { value: "amendments", label: "Amendments", count: amendmentCount },
  { value: "extensions", label: "Extensions", count: extensionCount },
];

// Helper function to check query parameters for both singular and plural forms
const getQueryParamValue = (
  searchParams: URLSearchParams,
  singular: string,
  plural: string
): string | null => {
  return searchParams.get(plural) || searchParams.get(singular);
};

export const DemonstrationDetail: React.FC = () => {
  const [modalType, setModalType] = useState<ModalType>(null);
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

  const { getDemonstrationById } = useDemonstration();
  const { trigger, data: demonstration, loading, error } = getDemonstrationById;

  // Memoize tab list to avoid recreation on every render
  const tabList = useMemo(() => createTabList(mockAmendments.length, mockExtensions.length), []);

  useEffect(() => {
    if (id) trigger(id);
  }, [id]);

  const handleEdit = useCallback(() => {
    setModalType("edit");
  }, []);

  const handleDelete = useCallback(() => {
    setModalType("delete");
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
                onClick={() => setModalType("amendment")}
              />
            )}

            {tab === "extensions" && (
              <ExtensionsTab
                demonstration={demonstration}
                onClick={() => setModalType("extension")}
              />
            )}
          </div>
          {modalType && (
            <DemonstrationDetailModals
              modalType={modalType}
              demonstration={demonstration}
              handleOnClose={() => setModalType(null)}
            />
          )}
        </>
      )}
    </div>
  );
};
