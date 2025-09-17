import React, { useState } from "react";

import { ApplicationWorkflow } from "components/application/ApplicationWorkflow";
import { SecondaryButton } from "components/button";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { AddNewIcon } from "components/icons";
import { ContactsTable } from "components/table/tables/ContactsTable";
import { DocumentTable } from "components/table/tables/DocumentTable";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";
import {
  Demonstration,
  DemonstrationStatus,
  Document,
  State,
  User,
} from "demos-server";
import {
  TabItem,
  Tabs,
} from "layout/Tabs";

import { Contact } from "./DemonstrationDetail";

type SubTabType = "summary" | "types" | "documents" | "contacts";
type DocumentModalType = "document" | null;

export type DemonstrationTabDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "effectiveDate" | "expirationDate"
> & {
  documents: (Pick<Document, "id" | "title" | "description" | "documentType" | "createdAt"> & {
    owner: Pick<User, "fullName">;
  })[];
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

  const handleUpdateContact = async (contactId: string, contactType: string) => {
    // TODO: Implement actual API call to update contact
    console.log("Updating contact:", { contactId, contactType });
    // This would typically call a mutation/API to update the contact in the database
    // await updateContactMutation({ variables: { id: contactId, contactType } });
  };

  const subTabList: TabItem[] = [
    { value: "summary", label: "Summary" },
    { value: "types", label: "Types", count: 0 },
    { value: "documents", label: "Documents", count: demonstration.documents.length },
    { value: "contacts", label: "Contacts", count: demonstration.contacts.length },
  ];

  return (
    <div>
      <ApplicationWorkflow demonstration={{ status: "DEMONSTRATION_UNDER_REVIEW" }} />
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
            <DocumentTable documents={demonstration.documents} />
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
            <ContactsTable
              contacts={demonstration.contacts}
              onUpdateContact={handleUpdateContact}
            />
          </>
        )}
      </div>

      {modalType === "document" && (
        <AddDocumentDialog isOpen={true} onClose={() => setModalType(null)} />
      )}
    </div>
  );
};
