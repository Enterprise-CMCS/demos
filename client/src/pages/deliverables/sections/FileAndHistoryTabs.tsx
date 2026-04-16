import { HorizontalSectionTabs, Tab } from "layout/Tabs";
import React from "react";

export const FileAndHistoryTabs = () => {
  return (
    <HorizontalSectionTabs defaultValue="files">
      <Tab label="Files" value="files"><div>Files Tab Coming Soon</div></Tab>
      <Tab label="History" value="history"><div>History Tab Coming Soon</div></Tab>
    </HorizontalSectionTabs>
  );
};
