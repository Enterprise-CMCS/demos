import React, { useState } from "react";

import { Button } from "components/button";
import {
  Contact,
  ContactsTable,
} from "components/table/tables/ContactsTable";

type ContactType =
  | "Primary Project Officer"
  | "Secondary Project Officer"
  | "State Representative"
  | "Subject Matter Expert";

const mockContacts: Contact[] = [
  {
    id: "1",
    fullName: "John Doe",
    email: "john@example.com",
    contactType: "Primary Project Officer" as ContactType,
  },
  {
    id: "2",
    fullName: "Jane Smith",
    email: "jane@example.com",
    contactType: "State Representative" as ContactType,
  },
  {
    id: "3",
    fullName: "Bob Johnson",
    email: "bob@example.com",
    contactType: "Subject Matter Expert" as ContactType,
  },
];

export const ContactsTableDemo: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);

  const handleUpdateContact = async (contactId: string, contactType: string) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Update the contact in state
    setContacts((prevContacts) =>
      prevContacts.map((contact) =>
        contact.id === contactId ? { ...contact, contactType: contactType as ContactType } : contact
      )
    );

    console.log(`Updated contact ${contactId} to type: ${contactType}`);
  };

  const resetContacts = () => {
    setContacts(mockContacts);
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
        <ContactsTable contacts={contacts} onUpdateContact={handleUpdateContact} />
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
