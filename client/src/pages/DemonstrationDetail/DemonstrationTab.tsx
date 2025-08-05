import React, { useState } from "react";

import { SecondaryButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { CreateNewModal } from "components/modal/CreateNewModal";
import { DocumentTable } from "components/table/tables/DocumentTable";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";
import {
  TabItem,
  Tabs,
} from "layout/Tabs";
import { summaryDemonstration } from "mock-data/summaryDetailMock";

type SubTabType = "summary" | "types" | "documents" | "contacts";
type DocumentModalType = "document" | null;

export const DemonstrationTab: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTabType>("summary");
  const [modalType, setModalType] = useState<DocumentModalType>(null);

  const subTabList: TabItem[] = [
    { value: "summary", label: "Summary" },
    { value: "types", label: "Types", count: 0 },
    { value: "documents", label: "Documents", count: 0 },
    { value: "contacts", label: "Contacts", count: 0 },
  ];

  return (
    <div>
      <Tabs
        tabs={subTabList}
        selectedValue={subTab}
        onChange={(newVal) => setSubTab(newVal as typeof subTab)}
      />

      <div className="mt-2">
        {subTab === "summary" && (
          <div>
            <SummaryDetailsTable
              demonstration={summaryDemonstration}
            />
          </div>
        )}

        {subTab === "types" && (
          <div>
            <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
              <h1 className="text-xl font-bold text-brand uppercase">
                Types
              </h1>
              {/* TO DO: Add New button? */}
            </div>
            {/* TO DO: Add Table */}
          </div>
        )}

        {subTab === "documents" && (
          <div>
            <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
              <h1 className="text-xl font-bold text-brand uppercase">
                Documents
              </h1>
              <SecondaryButton
                size="small"
                className="flex items-center gap-1 px-1 py-1"
                onClick={() => setModalType("document")}
              >
                <span>Add New</span>
                <AddNewIcon className="w-2 h-2" />
              </SecondaryButton>
            </div>
            <DocumentTable />
          </div>
        )}

        {subTab === "contacts" && (
          <div>
            <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
              <h1 className="text-xl font-bold text-brand uppercase">
                Contacts
              </h1>
              {/* TO DO: Add New button? */}
            </div>
            {/* TO DO: Add Table */}
          </div>
        )}
      </div>

      {modalType === "document" && (
        <CreateNewModal
          mode="document"
          data={{
            demonstration: "demo-id",
            state: "state-id",
            projectOfficer: "description",
          }}
          onClose={() => setModalType(null)}
        />
      )}
    </div>
  );
};
