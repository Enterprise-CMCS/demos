import React, { useEffect, useMemo, useState } from "react";

import { SecondaryButton } from "components/button";
import { CircleButton } from "components/button/CircleButton";
import {
  AddNewIcon,
  DeleteIcon,
  EditIcon,
  EllipsisIcon,
} from "components/icons";
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

import { isTestMode } from "../config/env";

export const DemonstrationDetail = () => {
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

  const [showButtons, setShowButtons] = useState(false);
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

  // Header content setup
  const headerContent = useMemo(() => {
    if (loading) {
      return (
        <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between">
          Loading demonstration...
        </div>
      );
    }

    if (error || !data) {
      return (
        <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between">
          Failed to load demonstration
        </div>
      );
    }

    return (
      <div className="w-full bg-brand text-white px-4 py-1 flex items-center justify-between">
        <div>
          <span className="-ml-2 block text-sm">
            <a
              className="underline underline-offset-2 decoration-gray-400 decoration-1 decoration-opacity-40"
              href="/demonstrations"
            >
              Demonstration List
            </a>{" "}
            {">"} {data.id}
          </span>
          <span className="font-bold block">{data.name}</span>

          <div data-testid="demonstration-detail-row" className="block text-sm">
            <span className="font-semibold">State/Territory:</span>{" "}
            <span>{data.state.id}</span>
          </div>

          <div data-testid="demonstration-detail-row" className="block text-sm">
            <span className="font-semibold">Project Officer:</span>{" "}
            <span>{data.description}</span>
          </div>
        </div>
        <div className="relative">
          {showButtons && (
            <span className="mr-0.75">
              <CircleButton
                aria-label="Delete demonstration"
                className="cursor-pointer flex items-center gap-1 px-1 py-1 mr-0.75"
                data-testid="delete-button"
                onClick={() => setModalType("delete")}
              >
                <DeleteIcon width="24" height="24" />
              </CircleButton>
              <CircleButton
                aria-label="Edit demonstration"
                className="cursor-pointer flex items-center gap-1 px-1 py-1"
                data-testid="edit-button"
                onClick={() => setModalType("edit")}
              >
                <EditIcon width="24" height="24" />
              </CircleButton>
            </span>
          )}
          <CircleButton
            className="cursor-pointer flex items-center gap-1 px-1 py-1"
            aria-label="Toggle more options"
            data-testid="toggle-ellipsis-button"
            onClick={() => setShowButtons((prev) => !prev)}
          >
            <span
              className={`transform transition-transform duration-200 ease-in-out ${
                showButtons ? "rotate-90" : "rotate-0"
                // eslint-disable-next-line indent
              }`}
            >
              <EllipsisIcon width="24" height="24" />
            </span>
          </CircleButton>
        </div>
      </div>
    );
  }, [data, loading, error, showButtons]);

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
            {tab === "details" && (
              <div>
                <h1 className="text-xl font-bold mb-4 text-brand uppercase border-b-1">
                  Demonstration Details
                </h1>
                <DocumentTable />
              </div>
            )}

            {tab === "amendments" && (
              <div>
                <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
                  <h1 className="text-xl font-bold text-brand uppercase">
                    Amendments
                  </h1>
                  <SecondaryButton
                    size="small"
                    className="flex items-center gap-1 px-1 py-1"
                    onClick={() => setModalType("amendment")}
                  >
                    <span>Add New</span>
                    <AddNewIcon className="w-2 h-2" />
                  </SecondaryButton>
                </div>
                <AmendmentTable
                  data={mockAmendments}
                  demonstrationId={data.id}
                />
              </div>
            )}

            {tab === "extensions" && (
              <div>
                <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
                  <h1 className="text-xl font-bold text-brand uppercase">
                    Extensions
                  </h1>
                  <SecondaryButton
                    size="small"
                    className="flex items-center gap-1 px-1 py-1"
                    onClick={() => setModalType("extension")}
                  >
                    <span>Add New</span>
                    <AddNewIcon className="w-2 h-2" />
                  </SecondaryButton>
                </div>
                <ExtensionTable
                  data={mockExtensions}
                  demonstrationId={data.id}
                />
              </div>
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
