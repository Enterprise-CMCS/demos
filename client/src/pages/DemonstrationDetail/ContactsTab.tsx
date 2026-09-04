import React from "react";
import { getCurrentUser, isReadonly } from "components/user/UserContext";
import { IconButton } from "components/button";
import { EditIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import {
  Demonstration as ServerDemonstration,
  DemonstrationRoleAssignment,
  Person,
  State,
} from "demos-server";

import { useDialog } from "components/dialog/DialogContext";
import { ContactsTable } from "components/table/tables/ContactsTable";
import { ExistingContactType } from "components/dialog/ManageContactsDialog";

type Role = Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
  person: Pick<Person, "fullName" | "id" | "email" | "personType">;
};

type Demonstration = Pick<ServerDemonstration, "id"> & {
  state: Pick<State, "id">;
  roles: Role[];
};

export const ContactsTab: React.FC<{ demonstration: Demonstration }> = ({ demonstration }) => {
  const { currentUser } = getCurrentUser();
  const { showManageContactsDialog } = useDialog();

  const rolesForDialog: ExistingContactType[] = (demonstration.roles || []).map((c) => ({
    id: `${c.role}-${c.person.id}`,
    person: {
      id: c.person.id,
      fullName: c.person.fullName,
      email: c.person.email,
      personType: c.person.personType,
    },
    role: c.role,
    isPrimary: c.isPrimary,
  }));

  return (
    <>
      <TabHeader title="Contacts">
        {!isReadonly(currentUser) && (
          <IconButton
            icon={<EditIcon />}
            name="manage-contacts"
            size="small"
            onClick={() =>
              showManageContactsDialog(demonstration.id, demonstration.state.id, rolesForDialog)
            }
          >
            Manage Contact(s)
          </IconButton>
        )}
      </TabHeader>
      <ContactsTable demonstrationId={demonstration.id} />
    </>
  );
};
