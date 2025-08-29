import { SecondaryButton } from "components/button";
import { AddNewIcon } from "components/icons";
import { DocumentTable } from "components/table/tables/DocumentTable";
import { Document, User } from "demos-server";
import React from "react";

type DocumentsTabProps = {
  handleOnClick: (type: "document" | null) => void;
  demonstration: {
    documents: (Pick<Document, "id" | "description" | "title" | "documentType" | "createdAt"> & {
      owner: Pick<User, "fullName">;
    })[];
  };
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ demonstration, handleOnClick }) => {
  return (
    <>
      <div className="flex justify-between items-center pb-1 mb-4 border-b border-brand">
        <h1 className="text-xl font-bold text-brand uppercase">Documents</h1>
        <SecondaryButton
          name="add-new-document"
          size="small"
          onClick={() => handleOnClick("document")}
        >
          <span>Add New</span>
          <AddNewIcon className="w-2 h-2" />
        </SecondaryButton>
      </div>
      <DocumentTable documents={demonstration.documents} />
    </>
  );
};
