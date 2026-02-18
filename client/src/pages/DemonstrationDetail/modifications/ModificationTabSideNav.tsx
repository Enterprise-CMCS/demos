import { Tab, VerticalTabs } from "layout/Tabs";
import React from "react";
import { ModificationItem } from "./ModificationTabs";

const TABS = {
  APPLICATION: "application",
  DETAILS: "details",
  DOCUMENTS: "documents",
};

export const ModificationTabSideNav = ({
  modificationItem,
}: {
  modificationItem: ModificationItem;
}) => {
  console.log(modificationItem);
  return (
    <VerticalTabs defaultValue={TABS.APPLICATION}>
      <Tab value={TABS.APPLICATION} label={TABS.APPLICATION}>
        Application
      </Tab>
      <Tab value={TABS.DETAILS} label={TABS.DETAILS}>
        Details
      </Tab>
      <Tab value={TABS.DOCUMENTS} label={TABS.DOCUMENTS}>
        Documents
      </Tab>
    </VerticalTabs>
  );
};
