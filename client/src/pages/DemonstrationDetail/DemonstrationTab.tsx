import React, { useState } from "react";

import { SecondaryButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { DocumentTable } from "components/table/tables/DocumentTable";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";
import { AddDocumentModal } from "components/modal/document/DocumentModal";
import { TabItem, Tabs } from "layout/Tabs";
import { DemonstrationDetailContacts } from "./DemonstrationDetailContacts";

type SubTabType = "summary" | "types" | "documents" | "contacts";
type DocumentModalType = "document" | null;

export type DemonstrationTabDetails = {
  demonstrationTypes: object[];
  documents: object[];
  contacts: object[];
};

export const DemonstrationTab: React.FC<{ demonstration: DemonstrationTabDetails }> = ({
  demonstration,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>("summary");
  const [modalType, setModalType] = useState<DocumentModalType>(null);

  const subTabList: TabItem[] = [
    { value: "summary", label: "Summary" },
    { value: "types", label: "Types", count: demonstration.demonstrationTypes.length },
    { value: "documents", label: "Documents", count: demonstration.documents.length },
    { value: "contacts", label: "Contacts", count: demonstration.contacts.length },
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
            <SummaryDetailsTable />
          </div>
        )}

        {subTab === "types" && (
          <div>
            <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
              <h1 className="text-xl font-bold text-brand uppercase">Types</h1>
              {/* TO DO: Add New button? */}
            </div>
            {/* TO DO: Add Table */}
          </div>
        )}

        {subTab === "documents" && (
          <div>
            <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
              <h1 className="text-xl font-bold text-brand uppercase">Documents</h1>
              <SecondaryButton
                name="add-new-document"
                size="small"
                onClick={() => setModalType("document")}
              >
                <span>Add New</span>
                <AddNewIcon className="w-2 h-2" />
              </SecondaryButton>
            </div>
            <DocumentTable />
          </div>
        )}

        {subTab === "contacts" && <DemonstrationDetailContacts />}
      </div>

      {/* Replaced the CreateNewModal */}
      {modalType === "document" && <AddDocumentModal onClose={() => setModalType(null)} />}
    </div>
  );
};
