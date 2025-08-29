import { SecondaryButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { ContactsTable } from "components/table/tables/ContactsTable";
import React from "react";

type ContactType =
  | "Primary Project Officer"
  | "Secondary Project Officer"
  | "State Representative"
  | "Subject Matter Expert";

export type Contact = {
  id: string;
  fullName: string | null;
  email: string | null;
  contactType: ContactType | null;
};

type ContactsTabDemonstration = {
  contacts?: Contact[];
};

type ContactsTabProps = {
  handleOnClick: (type: "document" | null) => void;
  demonstration: ContactsTabDemonstration;
};

export const ContactsTab: React.FC<ContactsTabProps> = ({ handleOnClick, demonstration }) => {
  return (
    <>
      <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
        <h1 className="text-xl font-bold text-brand uppercase">Contacts</h1>
        <SecondaryButton
          name="add-new-document"
          size="small"
          onClick={() => handleOnClick("document")}
        >
          <span>Add New</span>
          <AddNewIcon className="w-2 h-2" />
        </SecondaryButton>
      </div>
      <ContactsTable contacts={demonstration.contacts} />
    </>
  );
};
