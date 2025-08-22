import { ContactsTable } from "components/table/tables/ContactsTable";
import React from "react";

export const DemonstrationDetailContacts: React.FC = () => {
  return (
    <>
      <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
        <h1 className="text-xl font-bold text-brand uppercase">Contacts</h1>
      </div>
      <ContactsTable />
    </>
  );
};
