import React, { useState } from "react";

import { Button } from "components/button";
import { ContactsTable, DemonstrationRoleAssignment } from "components/table/tables/ContactsTable";
import { mockDemonstrationRoleAssignments } from "mock-data/demonstrationRoleAssignmentMocks";

// import { Role } from "demos-server";

export const ContactsTableDemo: React.FC = () => {
  const [roles, setRoles] = useState<DemonstrationRoleAssignment[]>(
    mockDemonstrationRoleAssignments
  );

  // const handleUpdateContact = async (role: DemonstrationRoleAssignment, contactType: string) => {
  //   // Simulate API delay
  //   await new Promise((resolve) => setTimeout(resolve, 1000));

  //   // Update the contact in state
  //   setRoles((prevContacts) =>
  //     prevContacts.map((contact) =>
  //       contact.person === role.person && contact.isPrimary === role.isPrimary
  //         ? { ...contact, contactType: contactType as Role }
  //         : contact
  //     )
  //   );

  //   console.log(`Updated contact of ${role.person.fullName} to type: ${contactType}`);
  // };

  const resetContacts = () => {
    setRoles(mockDemonstrationRoleAssignments);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Contacts Table Demo</h2>
      <div className="mb-4">
        <Button name="reset-contacts" onClick={resetContacts}>
          Reset Demo Data
        </Button>
      </div>
      <div className="bg-white p-4 border rounded">
        <ContactsTable roles={roles} />
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Instructions:</strong>
        </p>
        <ol className="list-decimal list-inside">
          <li>Select contact(s) by clicking the checkbox(es)</li>
          <li>For editing: Select exactly one contact and click &quot;Edit Contact&quot;</li>
          <li>For deleting: Select one or more contacts and click &quot;Remove Contact&quot;</li>
          <li>Change the contact type in the edit dialog and click &quot;Submit&quot;</li>
          <li>
            The table will update with contact type changes. Deletion shows confirmation toast but
            contacts remain in demo for testing purposes.
          </li>
        </ol>
      </div>
    </div>
  );
};
