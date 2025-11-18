import React from "react";

import { IconButton } from "components/button";
import { EditIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import {
  Demonstration as ServerDemonstration,
  DemonstrationRoleAssignment,
  Person,
} from "demos-server";

import { useDialog } from "components/dialog/DialogContext";
import { ContactsTable } from "components/table/tables/ContactsTable";
import { ExistingContactType } from "components/dialog/ManageContactsDialog";

type Role = Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
  person: Pick<Person, "fullName" | "id" | "email">;
};

type Demonstration = Pick<ServerDemonstration, "id"> & {
  roles: Role[];
};

function getRolesForDialog(demonstration: Demonstration): ExistingContactType[] {
  return (demonstration.roles || []).map((c) => ({
    person: {
      id: c.person.id,
      fullName: c.person.fullName,
      email: c.person.email,
      idmRoles: [], // unknown for existing; restrictions handled dynamically
    },
    role: c.role,
    isPrimary: c.isPrimary,
  }));
}

export const ContactsTab: React.FC<{ demonstration: Demonstration }> = ({ demonstration }) => {
  const { showManageContactsDialog } = useDialog();

  return (
    <>
      <TabHeader title="Contacts">
        <IconButton
          icon={<EditIcon />}
          name="manage-contacts"
          size="small"
          onClick={() =>
            showManageContactsDialog(demonstration.id, getRolesForDialog(demonstration))
          }
        >
          Manage Contact(s)
        </IconButton>
      </TabHeader>
      <ContactsTable demonstrationId={demonstration.id} />
    </>
  );
};
