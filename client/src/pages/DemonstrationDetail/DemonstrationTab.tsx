import React from "react";

import { ApplicationWorkflow } from "components/application/ApplicationWorkflow";
import { IconButton } from "components/button";
import {
  CharacteristicIcon,
  DetailsIcon,
  EditIcon,
  OpenFolderIcon,
  StackIcon,
} from "components/icons";
import { ContactsTable } from "components/table/tables/ContactsTable";
import {
  Demonstration,
  DemonstrationRoleAssignment,
  Document,
  Person,
  PhaseName,
} from "demos-server";
import { Tab, VerticalTabs } from "layout/Tabs";

import { SummaryDetailsTab } from "./SummaryDetailsTab";
import { useDialog } from "components/dialog/DialogContext";
import { DocumentsTab } from "./DocumentsTab";

type Role = Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
  person: Pick<Person, "fullName" | "id" | "email">;
};

export type DemonstrationTabDemonstration = Pick<Demonstration, "id" | "status"> & {
  documents: Pick<Document, "id">[];
  roles: Role[];
  currentPhaseName: PhaseName;
};

export const DemonstrationTab: React.FC<{ demonstration: DemonstrationTabDemonstration }> = ({
  demonstration,
}) => {
  const { showManageContactsDialog } = useDialog();

  return (
    <div className="p-[16px]">
      <ApplicationWorkflow demonstrationId={demonstration.id} />
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
          <DocumentsTab demonstrationId={demonstration.id} />
        </Tab>
        <Tab
          icon={<CharacteristicIcon />}
          label={`Contacts (${demonstration.roles?.length ?? 0})`}
          value="contacts"
        >
          <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
            <h1 className="text-xl font-bold text-brand uppercase">Contacts</h1>
            <IconButton
              icon={<EditIcon />}
              name="manage-contacts"
              size="small"
              onClick={() =>
                showManageContactsDialog(
                  demonstration.id,
                  (demonstration.roles || []).map((c) => ({
                    person: {
                      id: c.person.id,
                      fullName: c.person.fullName,
                      email: c.person.email,
                      idmRoles: [], // unknown for existing; restrictions handled dynamically
                    },
                    role: c.role,
                    isPrimary: c.isPrimary,
                  }))
                )
              }
            >
              Manage Contact(s)
            </IconButton>
          </div>
          <ContactsTable roles={demonstration.roles} />
        </Tab>
      </VerticalTabs>
    </div>
  );
};
