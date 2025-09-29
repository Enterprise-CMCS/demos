import React, { useState } from "react";

import { ApplicationWorkflow } from "components/application/ApplicationWorkflow";
import { SecondaryButton } from "components/button";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { AddNewIcon } from "components/icons";
import { ContactsTable } from "components/table/tables/ContactsTable";
import { DocumentTable } from "components/table/tables/DocumentTable";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";
import { TabItem, Tabs } from "layout/Tabs";
import { EditContactDialog } from "components/dialog";
import { BundleStatus, DemonstrationRoleAssignment, Demonstration, Document, Phase, Person, State, User } from "demos-server";

type SubTabType = "summary" | "types" | "documents" | "contacts";
type ModalType = "document" | "contact" | null;

type Role = Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
  person: Pick<Person, "fullName" | "id" | "email">;
};

export type DemonstrationTabDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "effectiveDate" | "expirationDate" | "status"
> & {
  documents: (Pick<Document, "id" | "title" | "description" | "documentType" | "createdAt"> & {
    owner: {
      person: Pick<Person, "fullName">;
    };
  })[];
  state: Pick<State, "id" | "name">;
  roles: Role[];
  projectOfficer: Pick<User, "id">;
  status: BundleStatus;
  currentPhase: Phase;
};

export const DemonstrationTab: React.FC<{ demonstration: DemonstrationTabDemonstration }> = ({
  demonstration,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>("summary");
  const [modalType, setModalType] = useState<ModalType>(null);

  const subTabList: TabItem[] = [
    { value: "summary", label: "Summary" },
    { value: "types", label: "Types", count: 0 },
    { value: "documents", label: "Documents", count: demonstration.documents.length },
    { value: "contacts", label: "Contacts", count: demonstration.roles.length },
  ];

  return (
    <div>
      <ApplicationWorkflow demonstration={demonstration} />
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
                name="add-new-contact"
                size="small"
                onClick={() => setModalType("contact")}
              >
                <span>Add New</span>
                <AddNewIcon className="w-2 h-2" />
              </SecondaryButton>
            </div>
            <ContactsTable roles={demonstration.roles} demonstrationId={demonstration.id} />
          </>
        )}
      </div>

      {modalType === "document" && (
        <AddDocumentDialog isOpen={true} onClose={() => setModalType(null)} />
      )}
      {modalType === "contact" && (
        <EditContactDialog
          demonstrationId={demonstration.id}
          isOpen={true}
          onClose={() => setModalType(null)}
        />
      )}
    </div>
  );
};
