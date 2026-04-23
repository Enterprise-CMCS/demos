import React, { useMemo, useState } from "react";

import { HorizontalSectionTabs, Tab } from "layout/Tabs";

import { CmsFilesTab } from "./CmsFilesTab";
import type { DeliverableFileRow } from "./DeliverableFileTypes";
import type { DeliverableDetailsManagementDeliverable } from "../DeliverableDetailsManagementPage";
import { HistoryTab, type DeliverableHistoryRow } from "./HistoryTab";
import { StateFilesTab } from "./StateFilesTab";

export const FILE_AND_HISTORY_TABS_NAME = "file-and-history-tabs";

const TABS = {
  STATE_FILES: "state_files",
  CMS_FILES: "cms_files",
  HISTORY: "history",
};

const withCurrentFlag = (
  files: DeliverableDetailsManagementDeliverable["stateDocuments"],
  currentFileIds: Record<string, boolean>
): DeliverableFileRow[] =>
  files.map((file) => ({
    ...file,
    isCurrent: currentFileIds[file.id] ?? false,
  }));

const buildTabLabel = (label: string, count: number) => (count > 0 ? `${label} (${count})` : label);

const EMPTY_HISTORY: DeliverableHistoryRow[] = [];

export const FileAndHistoryTabs: React.FC<{
  deliverable: DeliverableDetailsManagementDeliverable;
}> = ({ deliverable }) => {
  const [stateFileIsCurrent, setStateFileIsCurrent] = useState<Record<string, boolean>>({});

  const stateFiles = useMemo(
    () => withCurrentFlag(deliverable.stateDocuments, stateFileIsCurrent),
    [deliverable.stateDocuments, stateFileIsCurrent]
  );
  const cmsFiles = useMemo(
    () => withCurrentFlag(deliverable.cmsDocuments, {}),
    [deliverable.cmsDocuments]
  );

  const handleToggleCurrent = (fileId: string, nextValue: boolean) => {
    setStateFileIsCurrent((prev) => ({ ...prev, [fileId]: nextValue }));
  };

  return (
    <div data-testid={FILE_AND_HISTORY_TABS_NAME}>
      <HorizontalSectionTabs defaultValue={TABS.STATE_FILES}>
        <Tab label={buildTabLabel("State Files", stateFiles.length)} value={TABS.STATE_FILES}>
          <StateFilesTab files={stateFiles} onToggleCurrent={handleToggleCurrent} />
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
