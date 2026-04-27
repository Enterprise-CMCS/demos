import { HorizontalSectionTabs, Tab } from "layout/Tabs";
import React from "react";
import { StateFilesTable } from "./StateFilesTable";

export const FILE_AND_HISTORY_TABS_NAME = "file-and-history-tabs";

const TABS = {
  STATE_FILES: "state_files",
  CMS_FILES: "cms_files",
  HISTORY: "history",
};

export const FileAndHistoryTabs = () => {
  return (
    <div data-testid={FILE_AND_HISTORY_TABS_NAME}>
      <HorizontalSectionTabs defaultValue={TABS.STATE_FILES} variant="bordered">
        <Tab label="State Files" value={TABS.STATE_FILES}>
          <StateFilesTable />
        </Tab>
        <Tab label="CMS Files" value={TABS.CMS_FILES}>
          <div>CMS Files Tab Coming Soon</div>
        </Tab>
        <Tab label="History" value={TABS.HISTORY}>
          <div>History Tab Coming Soon</div>
        </Tab>
      </HorizontalSectionTabs>
    </div>
  );
};
