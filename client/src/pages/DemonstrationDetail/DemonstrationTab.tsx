import React, { useState } from "react";

import { ApplicationWorkflow } from "components/application/ApplicationWorkflow";
import { SecondaryButton } from "components/button";
import { EditContactDialog } from "components/dialog";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { AddNewIcon } from "components/icons";
import { ContactsTable } from "components/table/tables/ContactsTable";
import { DocumentTable } from "components/table/tables/DocumentTable";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";
import {
  BundleStatus,
  Demonstration,
  DemonstrationRoleAssignment,
  Document,
  Person,
  PhaseName,
  State,
  User,
} from "demos-server";
import { Tab, Tabs } from "layout/Tabs";

type ModalType = "document" | "contact" | null;

type Role = Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
  person: Pick<Person, "fullName" | "id" | "email">;
};

export type DemonstrationTabDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "effectiveDate" | "expirationDate" | "status"
> & {
  documents: (Pick<Document, "id" | "name" | "description" | "documentType" | "createdAt"> & {
    owner: {
      person: Pick<Person, "fullName">;
    };
  })[];
  state: Pick<State, "id" | "name">;
  roles: Role[];
  projectOfficer: Pick<User, "id">;
  status: BundleStatus;
  currentPhaseName: PhaseName;
};

export const DemonstrationTab: React.FC<{ demonstration: DemonstrationTabDemonstration }> = ({
  demonstration,
}) => {
  const [modalType, setModalType] = useState<ModalType>(null);

  return (
    <div>
      <ApplicationWorkflow demonstration={demonstration} />
      <Tabs defaultValue="summary">
        <Tab label="Summary" value="summary">
          <SummaryDetailsTable demonstration={demonstration} />
        </Tab>
        <Tab label="Types (0)" value="demonstrationTypes">
          <div className="border border-gray-300 bg-white p-2 shadow-sm">
            <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
              <h1 className="text-xl font-bold text-brand uppercase">Types</h1>
              {/* TO DO: Add New button? */}
            </div>
          </div>
        </Tab>
        <Tab label={`Documents (${demonstration.documents?.length ?? 0})`} value="documents">
          <div className="border border-gray-300 bg-white p-2 shadow-sm">
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
        </Tab>
        <Tab label={`Contacts (${demonstration.roles?.length ?? 0})`} value="contacts">
          <div className="border border-gray-300 bg-white p-2 shadow-sm">
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
          </div>
        </Tab>
      </Tabs>

      {modalType === "document" && (
        <AddDocumentDialog
          isOpen={true}
          onClose={() => setModalType(null)}
          initialDocument={{
            id: demonstration.id,
            name: "",
            description: "",
            documentType: "General File",
            file: null,
          }}
        />
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
