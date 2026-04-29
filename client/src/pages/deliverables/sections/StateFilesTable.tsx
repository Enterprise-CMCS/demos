import React from "react";
import { TabHeader } from "components/table/TabHeader";
import { DocumentTable, type DocumentTableDocument } from "components/table/tables/DocumentTable";

const STATE_FILES: DocumentTableDocument[] = [];

export const StateFilesTable = () => {
  return (
    <>
      <TabHeader title="State Files" />
      <DocumentTable applicationId="mock-deliverable-application-id" documents={STATE_FILES} />
    </>
  );
};
