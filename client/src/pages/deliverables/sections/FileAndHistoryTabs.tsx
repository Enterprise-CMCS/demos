import { HorizontalSectionTabs, Tab } from "layout/Tabs";
import React from "react";
import { DocumentTable, type DocumentTableDocument } from "components/table/tables/DocumentTable";

export const FILE_AND_HISTORY_TABS_NAME = "file-and-history-tabs";

const TABS = {
  STATE_FILES: "state_files",
  CMS_FILES: "cms_files",
  HISTORY: "history",
};

const MOCK_STATE_FILES: DocumentTableDocument[] = [
  {
    id: "mock-state-file-1",
    name: "Example File",
    description: "CMS guidelines for service utilization reporting requirements",
    documentType: "General File",
    owner: { person: { fullName: "Florida State" } },
    createdAt: new Date("2026-03-23T00:00:00.000Z"),
  },
  {
    id: "mock-state-file-2",
    name: "Quarterly Reporting Template",
    description: "Template provided for state quarterly deliverable submission",
    documentType: "General File",
    owner: { person: { fullName: "CMS User" } },
    createdAt: new Date("2026-03-21T00:00:00.000Z"),
  },
];

export const FileAndHistoryTabs = () => {
  return (
    <div data-testid={FILE_AND_HISTORY_TABS_NAME}>
      <HorizontalSectionTabs defaultValue={TABS.STATE_FILES} variant="bordered">
        <Tab label={`State Files (${MOCK_STATE_FILES.length})`} value={TABS.STATE_FILES}>
          <DocumentTable applicationId="mock-deliverable-application-id" documents={MOCK_STATE_FILES} />
        </Tab>
        <Tab label="CMS Files" value={TABS.CMS_FILES}><div>CMS Files Tab Coming Soon</div></Tab>
        <Tab label="History" value={TABS.HISTORY}><div>History Tab Coming Soon</div></Tab>
      </HorizontalSectionTabs>
    </div>
  );
};
