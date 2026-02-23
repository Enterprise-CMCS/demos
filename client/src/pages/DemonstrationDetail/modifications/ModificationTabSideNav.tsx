import { Tab, VerticalTabs } from "layout/Tabs";
import React from "react";
import { ModificationItem } from "./ModificationTabs";
import { DetailsIcon, ListIcon, OpenFolderIcon } from "components/icons";
import { ModificationDetailsSummary } from "./ModificationDetailsSummary";

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
  return (
    <VerticalTabs defaultValue={TABS.APPLICATION}>
      <Tab icon={<ListIcon />} value={TABS.APPLICATION} label="Application">
        Application Tab for {modificationItem.name}
      </Tab>
      <Tab icon={<DetailsIcon />} value={TABS.DETAILS} label="Details">
        <ModificationDetailsSummary modificationItem={modificationItem} />
      </Tab>
      <Tab icon={<OpenFolderIcon />} value={TABS.DOCUMENTS} label="Documents">
        Documents Tab for {modificationItem.name}
      </Tab>
    </VerticalTabs>
  );
};
