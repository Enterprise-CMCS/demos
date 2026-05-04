import React from "react";

import { HorizontalSectionTabs, Tab } from "layout/Tabs";

import { CmsFilesTab } from "./CmsFilesTab";
import type { DeliverableDetailsManagementDeliverable } from "../DeliverableDetailsManagementPage";
import { HistoryTab, type DeliverableHistoryRow } from "./HistoryTab";
import { StateFilesTab } from "./StateFilesTab";

export const FILE_AND_HISTORY_TABS_NAME = "file-and-history-tabs";

const TABS = {
  STATE_FILES: "state_files",
  CMS_FILES: "cms_files",
  HISTORY: "history",
};

const buildTabLabel = (label: string, count: number) => (count > 0 ? `${label} (${count})` : label);

const EMPTY_HISTORY: DeliverableHistoryRow[] = [];

export const FileAndHistoryTabs: React.FC<{
  deliverable: DeliverableDetailsManagementDeliverable;
}> = ({ deliverable }) => {
  const stateFiles = deliverable.stateDocuments;
  const cmsFiles = deliverable.cmsDocuments;

  return (
    <div data-testid={FILE_AND_HISTORY_TABS_NAME}>
      <HorizontalSectionTabs defaultValue={TABS.STATE_FILES} variant="bordered">
        <Tab label={buildTabLabel("State Files", stateFiles.length)} value={TABS.STATE_FILES}>
          <StateFilesTab files={stateFiles} />
        </Tab>
        <Tab label={buildTabLabel("CMS Files", cmsFiles.length)} value={TABS.CMS_FILES}>
          <CmsFilesTab files={cmsFiles} />
        </Tab>
        <Tab label="History" value={TABS.HISTORY}>
          <HistoryTab rows={EMPTY_HISTORY} />
        </Tab>
      </HorizontalSectionTabs>
    </div>
  );
};
