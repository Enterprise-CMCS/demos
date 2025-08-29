import React, { useState } from "react";

import { SecondaryButton } from "components/button";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { AddNewIcon } from "components/icons";
import { DocumentTable } from "components/table/tables/DocumentTable";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";
import { TabItem, Tabs } from "layout/Tabs";
import { Contact } from "./DemonstrationDetail";
import { ContactsTable } from "components/table/tables/ContactsTable";
import {
  ApplicationWorkflow,
  ApplicationWorkflowDemonstration,
} from "components/application/ApplicationWorkflow";
import { Demonstration, DemonstrationStatus, State, User } from "demos-server";

type SubTabType = "summary" | "types" | "documents" | "contacts";
type DocumentModalType = "document" | null;

export type DemonstrationTabDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "effectiveDate" | "expirationDate"
> & {
  demonstrationTypes: object[];
  documents: object[];
  contacts: Pick<Contact, "fullName" | "email" | "contactType" | "id">[];
  state: Pick<State, "id" | "name">;
  projectOfficer: Pick<User, "fullName" | "id">;
  demonstrationStatus: Pick<DemonstrationStatus, "name">;
};

export const DemonstrationTab: React.FC<{ demonstration: DemonstrationTabDemonstration }> = ({
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

  const MOCK_DEMONSTRATION: ApplicationWorkflowDemonstration = {
    status: "under_review",
  };

  return (
    <div>
      <ApplicationWorkflow demonstration={MOCK_DEMONSTRATION} />
      <Tabs
        tabs={subTabList}
        selectedValue={subTab}
        onChange={(newVal) => setSubTab(newVal as typeof subTab)}
      />

      <div className="mt-2">
        {subTab === "summary" && (
          <div>
            <SummaryDetailsTable demonstration={demonstration} />
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

        {subTab === "contacts" && (
          <>
            <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
              <h1 className="text-xl font-bold text-brand uppercase">Contacts</h1>
              <SecondaryButton
                name="add-new-document"
                size="small"
                onClick={() => setModalType("document")}
              >
                <span>Add New</span>
                <AddNewIcon className="w-2 h-2" />
              </SecondaryButton>
            </div>
            <ContactsTable contacts={demonstration.contacts} />
          </>
        )}
      </div>

      {modalType === "document" && <AddDocumentDialog onClose={() => setModalType(null)} />}
    </div>
  );
};
