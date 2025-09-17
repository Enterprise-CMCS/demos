import React, { useState } from "react";

import { ApplicationWorkflow } from "components/application/ApplicationWorkflow";
import { SecondaryButton } from "components/button";
import { AddDocumentDialog } from "components/dialog/document/DocumentDialog";
import { AddNewIcon } from "components/icons";
import { ContactsTable } from "components/table/tables/ContactsTable";
import { DocumentTable } from "components/table/tables/DocumentTable";
import { SummaryDetailsTable } from "components/table/tables/SummaryDetailsTable";
import { TabItem, Tabs } from "layout/Tabs";
import { Document } from "demos-server";
import { gql, useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";

type SubTabType = "summary" | "types" | "documents" | "contacts";
type DocumentModalType = "document" | null;

export const DEMONSTRATION_TAB_QUERY = gql`
  query DemonstrationTab($demonstrationId: ID!) {
    demonstration(id: $demonstrationId) {
      id
      documents {
        id
      }
      contacts {
        id
      }
    }
  }
`;

export type Contact = {
  id: string;
  fullName: string | null;
  email: string | null;
  contactType: ContactType | null;
};

export type ContactType =
  | "Primary Project Officer"
  | "Secondary Project Officer"
  | "State Representative"
  | "Subject Matter Expert";

type Demonstration = {
  documents: Pick<Document, "id">[];
  contacts: Pick<Contact, "id">[];
};

export const DemonstrationTab: React.FC = () => {
  const [subTab, setSubTab] = useState<SubTabType>("summary");
  const [modalType, setModalType] = useState<DocumentModalType>(null);
  const { id } = useParams<{ id: string }>();
  const { data, error, loading } = useQuery<{ demonstration: Demonstration }>(
    DEMONSTRATION_TAB_QUERY,
    {
      variables: { demonstrationId: id },
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const demonstration = data?.demonstration;

  if (!demonstration) return <div>No demonstration data found.</div>;

  const handleUpdateContact = async (contactId: string, contactType: string) => {
    // TODO: Implement actual API call to update contact
    console.log("Updating contact:", { contactId, contactType });
    // This would typically call a mutation/API to update the contact in the database
    // await updateContactMutation({ variables: { id: contactId, contactType } });
  };

  const handleDeleteContacts = async (contactIds: string[]) => {
    // TODO: Implement actual API call to delete contacts
    console.log("Deleting contacts:", contactIds);
    // This would typically call a mutation/API to delete the contacts from the database
    // await deleteContactsMutation({ variables: { ids: contactIds } });
  };

  const subTabList: TabItem[] = [
    { value: "summary", label: "Summary" },
    { value: "types", label: "Types", count: 0 },
    { value: "documents", label: "Documents", count: demonstration.documents.length },
    { value: "contacts", label: "Contacts", count: demonstration.contacts.length },
  ];

  return (
    <div>
      <ApplicationWorkflow />
      <Tabs
        tabs={subTabList}
        selectedValue={subTab}
        onChange={(newVal) => setSubTab(newVal as typeof subTab)}
      />

      <div className="mt-2">
        {subTab === "summary" && (
          <div>
            <SummaryDetailsTable />
          </div>
        )}

        {subTab === "types" && (
          <div>
            <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
              <h1 className="text-xl font-bold text-brand uppercase">Types</h1>
              {/* TO DO: Add New button? */}
            </div>
            {/* TO DO: Add Table */}
          </div>
        )}

        {subTab === "documents" && (
          <div>
            <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
              <h1 className="text-xl font-bold text-brand uppercase">Documents</h1>
              <SecondaryButton
                name="add-new-document"
                size="small"
                onClick={() => setModalType("document")}
              >
                <span>Add New</span>
                <AddNewIcon className="w-2 h-2" />
              </SecondaryButton>
            </div>
            <DocumentTable />
          </div>
        )}

        {subTab === "contacts" && (
          <>
            <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
              <h1 className="text-xl font-bold text-brand uppercase">Contacts</h1>
              <SecondaryButton
                name="add-new-document"
                size="small"
                onClick={() => setModalType("document")}
              >
                <span>Add New</span>
                <AddNewIcon className="w-2 h-2" />
              </SecondaryButton>
            </div>
            <ContactsTable
              onUpdateContact={handleUpdateContact}
              onDeleteContacts={handleDeleteContacts}
            />
          </>
        )}
      </div>

      {modalType === "document" && (
        <AddDocumentDialog isOpen={true} onClose={() => setModalType(null)} />
      )}
    </div>
  );
};
