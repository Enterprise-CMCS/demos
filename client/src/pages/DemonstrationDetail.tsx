import React, { useEffect, useState } from "react";

import { SecondaryButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { CreateNewModal } from "components/modal/CreateNewModal";
import { AmendmentTable } from "components/table/tables/AmendmentTable";
import { DocumentTable } from "components/table/tables/DocumentTable";
import { ExtensionTable } from "components/table/tables/ExtensionTable";
import { useDemonstration } from "hooks/useDemonstration";
import { usePageHeader } from "hooks/usePageHeader";
import { TabItem, Tabs } from "layout/Tabs";
import { mockAmendments } from "mock-data/amendmentMocks";
import { mockExtensions } from "mock-data/extensionMocks";
import { useLocation, useParams } from "react-router-dom";

import { isTestMode } from "config/env";
import { DemonstrationDetailHeader } from "components/header/headers/DemonstrationDetailHeader";
import { Demonstration } from "demos-server";

const DetailsTab: React.FC = () => (
  <div>
    <h1 className="text-xl font-bold mb-4 text-brand uppercase border-b-1">
      Documents
    </h1>
    <DocumentTable />
  </div>
);

const AmendmentsTab: React.FC<{
  data: Demonstration;
  onClick: (id: string) => void;
}> = ({ data, onClick }) => (
  <div>
    <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
      <h1 className="text-xl font-bold text-brand uppercase">Amendments</h1>
      <SecondaryButton
        size="small"
        className="flex items-center gap-1 px-1 py-1"
        onClick={() => onClick}
      >
        <span>Add New</span>
        <AddNewIcon className="w-2 h-2" />
      </SecondaryButton>
    </div>
    <AmendmentTable data={mockAmendments} demonstrationId={data.id} />
  </div>
);

const ExtensionsTab: React.FC<{
  data: Demonstration;
  onClick: (id: string) => void;
}> = ({ data, onClick }) => (
  <div>
    <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
      <h1 className="text-xl font-bold text-brand uppercase">Extensions</h1>
      <SecondaryButton
        size="small"
        className="flex items-center gap-1 px-1 py-1"
        onClick={() => onClick}
      >
        <span>Add New</span>
        <AddNewIcon className="w-2 h-2" />
      </SecondaryButton>
    </div>
    <ExtensionTable data={mockExtensions} demonstrationId={data.id} />
  </div>
);

export const DemonstrationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Parse query params
  const queryParams = React.useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const initialTab = React.useMemo(() => {
    if (
      queryParams.get("amendment") === "true" ||
      queryParams.get("amendments") === "true"
    ) {
      return "amendments";
    }
    if (
      queryParams.get("extension") === "true" ||
      queryParams.get("extensions") === "true"
    ) {
      return "extensions";
    }
    return "details";
  }, [queryParams]);

  const [modalType, setModalType] = useState<
    "edit" | "delete" | "amendment" | "extension" | null
  >(null);
  const [tab, setTab] = useState<"details" | "amendments" | "extensions">(
    "details"
  );

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const { getDemonstrationById } = useDemonstration();
  const { trigger, data, loading, error } = getDemonstrationById;

  useEffect(() => {
    if (id) trigger(id);
  }, [id]);

  const tabList: TabItem[] = [
    { value: "details", label: "Demonstration Details" },
    { value: "amendments", label: "Amendments", count: mockAmendments.length },
    { value: "extensions", label: "Extensions", count: mockExtensions.length },
  ];

  const headerContent = (
    <DemonstrationDetailHeader
      data={data}
      loading={loading}
      error={error}
      onEdit={() => setModalType("edit")}
      onDelete={() => setModalType("delete")}
    />
  );
  usePageHeader(headerContent);

  return (
    <div>
      {isTestMode() && headerContent}

      {loading && <p>Loading...</p>}
      {error && <p>Error loading demonstration</p>}

      {data && (
        <>
          <Tabs
            tabs={tabList}
            selectedValue={tab}
            onChange={(newVal) => setTab(newVal as typeof tab)}
          />

          <div className="mt-4 h-[60vh] overflow-y-auto">
            {tab === "details" && <DetailsTab />}

            {tab === "amendments" && (
              <AmendmentsTab
                data={data}
                onClick={() => setModalType("amendment")}
              />
            )}

            {tab === "extensions" && (
              <ExtensionsTab
                data={data}
                onClick={() => setModalType("extension")}
              />
            )}
          </div>
        </>
      )}

      {modalType === "amendment" && data && (
        <CreateNewModal
          mode="amendment"
          data={{ demonstration: data.id }}
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === "extension" && data && (
        <CreateNewModal
          mode="extension"
          data={{ demonstration: data.id }}
          onClose={() => setModalType(null)}
        />
      )}

      {modalType === "edit" && data && (
        <CreateNewModal
          mode="demonstration"
          data={{
            title: data.name,
            state: data.state?.id,
            projectOfficer: data.description,
            description: data.description,
          }}
          onClose={() => setModalType(null)}
        />
      )}
    </div>
  );
};
