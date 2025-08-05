import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useDemonstration } from "hooks/useDemonstration";
import { usePageHeader } from "hooks/usePageHeader";
import { TabItem, Tabs } from "layout/Tabs";
import { mockAmendments } from "mock-data/amendmentMocks";
import { mockExtensions } from "mock-data/extensionMocks";
import { useLocation, useParams } from "react-router-dom";

import { isTestMode } from "config/env";
import { DemonstrationDetailHeader } from "pages/DemonstrationDetail/DemonstrationDetailHeader";
import { DemonstrationDetailModals } from "./DemonstrationDetailModals";
import { DemonstrationTab } from "./DemonstrationTab";
import { AmendmentsTab } from "./AmendmentsTab";
import { ExtensionsTab } from "./ExtensionsTab";

type ModalType = "edit" | "delete" | "amendment" | "extension" | null;
type TabType = "details" | "amendments" | "extensions";

const tabList: TabItem[] = [
  { value: "details", label: "Demonstration Details" },
  { value: "amendments", label: "Amendments", count: mockAmendments.length },
  { value: "extensions", label: "Extensions", count: mockExtensions.length },
];

export const DemonstrationDetail: React.FC = () => {
  const [modalType, setModalType] = useState<ModalType>(null);
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const [tab, setTab] = useState<TabType>(() => {
    const amendmentParam =
      queryParams.get("amendments") || queryParams.get("amendment");
    const extensionParam =
      queryParams.get("extensions") || queryParams.get("extension");

    if (amendmentParam === "true") return "amendments";
    if (extensionParam === "true") return "extensions";
    return "details";
  });

  const { getDemonstrationById } = useDemonstration();
  const { trigger, data: demonstration, loading, error } = getDemonstrationById;

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
