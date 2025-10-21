import React, { useState } from "react";

import { ApplicationWorkflow } from "components/application/ApplicationWorkflow";
import { SecondaryButton } from "components/button";
import { EditContactDialog, ManageContactsDialog } from "components/dialog";
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
import { Demonstration, Document, PhaseName, Person } from "demos-server";
import { VerticalTabs, Tab } from "layout/Tabs";
import { SummaryDetailsTab } from "./SummaryDetailsTab";

type ModalType = "document" | "contact" | "manage-contacts" | null;

export type DemonstrationTabDemonstration = Pick<Demonstration, "id" | "status"> & {
  documents: (Pick<Document, "id" | "name" | "description" | "documentType" | "createdAt"> & {
    owner: {
      person: Pick<Person, "fullName">;
    };
  })[];
  roles: [];
  currentPhaseName: PhaseName;
};

export const DemonstrationTab: React.FC<{ demonstration: DemonstrationTabDemonstration }> = ({
  demonstration,
}) => {
  const [modalType, setModalType] = useState<ModalType>(null);

  const searchPeople = async (q: string) => {
  // TODO: replace with server search
    return [] as Array<{ id: string; fullName: string; email: string }>;
  };

  // Stub for saveAssignments - replace with actual implementation
  const saveAssignments = async (assignments: any) => {
    // TODO: implement save logic (e.g., API call)
    console.log("Saving assignments:", assignments);
    return Promise.resolve();
  };

  // --- STUB: contact type options (id/label) ---
  const contactTypeOptions = [
  // TODO: replace with lookup query
    { id: "project_officer", label: "Project Officer" },
    { id: "finance", label: "Finance" },
  ];
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
              onClick={() => setModalType("manage-contacts")}
            >
              Manage Contacts
              <EditIcon className="w-2 h-2" />
            </SecondaryButton>
          </div>
          <ContactsTable roles={demonstration.roles} demonstrationId={demonstration.id} />
        </Tab>
      </VerticalTabs>

      {modalType === "manage-contacts" && (
        // <ManageContactsDialog
        //   isOpen={true}
        //   onClose={() => setModalType(null)}
        //   // Map current roles into the dialog's expected shape
        //   initialAssignments={(demonstration.roles ?? []).map((r: any) => ({
        //     person: {
        //       id: r.person.id,
        //       fullName: r.person.fullName,
        //       email: r.person.email,
        //     },
        //     roleId: r.role ?? null,
        //     isPrimary: !!r.isPrimary,
        //   }))}
        //   contactTypeOptions={contactTypeOptions}
        //   onSearchPeople={searchPeople}
        //   onSave={async (assignments) => {
        //     await saveAssignments(assignments);
        //     setModalType(null);
        //   }}
        //   applicationId={demonstration.id}
        // />
        <ManageContactsDialog
          isOpen={true}
          applicationId={demonstration.id}
          onClose={() => setModalType(null)}
        />
      )}
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
