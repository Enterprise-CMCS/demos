import React, { useState } from "react";

import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { TabItem, Tabs } from "layout/Tabs";
import { Contact } from "..";
import { Demonstration, DemonstrationStatus, Document, State, User } from "demos-server";
import { SummaryTab } from "./SummaryTab";
import { TypesTab } from "./TypesTab";
import { DocumentsTab } from "./DocumentsTab";
import { ContactsTab } from "./ContactsTab";

type SubTabType = "summary" | "types" | "documents" | "contacts";
type DocumentModalType = "document" | null;

export type DemonstrationDetailsTabDemonstration = Pick<
  Demonstration,
  "id" | "name" | "description" | "effectiveDate" | "expirationDate"
> & {
  demonstrationTypes: object[];
  documents: (Pick<Document, "id" | "description" | "title" | "createdAt" | "documentType"> & {
    owner: Pick<User, "fullName">;
  })[];
  contacts: Pick<Contact, "fullName" | "email" | "contactType" | "id">[];
  state: Pick<State, "id" | "name">;
  projectOfficer: Pick<User, "fullName" | "id">;
  demonstrationStatus: Pick<DemonstrationStatus, "name">;
};

export const DemonstrationDetailsTab: React.FC<{ demonstration: DemonstrationDetailsTabDemonstration }> = ({
  demonstration,
}) => {
  const [subTab, setSubTab] = useState<SubTabType>("summary");
  const [modalType, setModalType] = useState<DocumentModalType>(null);

  const subTabList: TabItem[] = [
    { value: "summary", label: "Summary" },
    { value: "types", label: "Types", count: demonstration.demonstrationTypes.length },
    { value: "documents", label: "Documents", count: demonstration.documents.length },
    { value: "contacts", label: "Contacts", count: demonstration.contacts.length },
  ];

  return (
    <>
      <Tabs
        tabs={subTabList}
        selectedValue={subTab}
        onChange={(newVal) => setSubTab(newVal as typeof subTab)}
      />

      <div className="mt-2">
        {subTab === "summary" && <SummaryTab demonstration={demonstration} />}
        {subTab === "types" && <TypesTab />}
        {subTab === "documents" && (
          <DocumentsTab demonstration={demonstration} handleOnClick={setModalType} />
        )}
        {subTab === "contacts" && (
          <ContactsTab demonstration={demonstration} handleOnClick={setModalType} />
        )}
      </div>

      {modalType === "document" && <AddDocumentDialog onClose={() => setModalType(null)} />}
    </>
  );
};
