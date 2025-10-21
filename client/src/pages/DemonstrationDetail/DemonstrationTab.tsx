import React, { useState } from "react";

import { ApplicationWorkflow } from "components/application/ApplicationWorkflow";
import { SecondaryButton } from "components/button";
import { EditContactDialog } from "components/dialog";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import {
  AddNewIcon,
  CharacteristicIcon,
  DetailsIcon,
  EditIcon,
  OpenFolderIcon,
  StackIcon,
} from "components/icons";
import { ContactsTable } from "components/table/tables/ContactsTable";
import { DocumentTable } from "components/table/tables/DocumentTable";
import {
  Demonstration,
  Document,
  PhaseName,
  Person,
  DemonstrationRoleAssignment,
} from "demos-server";
import { VerticalTabs, Tab } from "layout/Tabs";
import { SummaryDetailsTab } from "./SummaryDetailsTab";

type ModalType = "document" | "contact" | null;

export type DemonstrationTabDemonstration = Pick<Demonstration, "id" | "status"> & {
  documents: (Pick<Document, "id" | "name" | "description" | "documentType" | "createdAt"> & {
    owner: {
      person: Pick<Person, "fullName">;
    };
  })[];
  roles: (Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
    person: Pick<Person, "id" | "fullName" | "email">;
  })[];
  currentPhaseName: PhaseName;
};

export const DemonstrationTab: React.FC<{ demonstration: DemonstrationTabDemonstration }> = ({
  demonstration,
}) => {
  const [modalType, setModalType] = useState<ModalType>(null);

  return (
    <div className="p-[16px]">
      <ApplicationWorkflow demonstration={demonstration} />
      <VerticalTabs defaultValue="details">
        <Tab icon={<DetailsIcon />} label="Details" value="details">
          <SummaryDetailsTab demonstrationId={demonstration.id} />
        </Tab>
        <Tab icon={<StackIcon />} label="Types (0)" value="demonstrationTypes">
          <h1 className="text-xl font-bold text-brand uppercase">Types</h1>
          {/* TO DO: Add New button? */}
        </Tab>
        <Tab
          icon={<OpenFolderIcon />}
          label={`Documents (${demonstration.documents?.length ?? 0})`}
          value="documents"
        >
          <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
            <h1 className="text-xl font-bold text-brand uppercase">Documents</h1>
            <SecondaryButton
              name="add-new-document"
              size="small"
              onClick={() => setModalType("document")}
            >
              Add Document
              <AddNewIcon className="w-2 h-2" />
            </SecondaryButton>
          </div>
          <DocumentTable applicationId={demonstration.id} documents={demonstration.documents} />
        </Tab>
        <Tab
          icon={<CharacteristicIcon />}
          label={`Contacts (${demonstration.roles?.length ?? 0})`}
          value="contacts"
        >
          <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
            <h1 className="text-xl font-bold text-brand uppercase">Contacts</h1>
            <SecondaryButton
              name="add-new-contact"
              size="small"
              onClick={() => setModalType("contact")}
            >
              Manage Contacts
              <EditIcon className="w-2 h-2" />
            </SecondaryButton>
          </div>
          <ContactsTable roles={demonstration.roles} demonstrationId={demonstration.id} />
        </Tab>
      </VerticalTabs>

      {modalType === "document" && (
        <AddDocumentDialog
          isOpen={true}
          onClose={() => setModalType(null)}
          applicationId={demonstration.id}
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
