import { Tab, VerticalTabs } from "layout/Tabs";
import React from "react";
import { ModificationItem } from "./ModificationTabs";
import { DetailsIcon, ListIcon, OpenFolderIcon } from "components/icons";
import { ModificationDetailsSummary } from "./ModificationDetailsSummary";
import { AmendmentWorkflow, ExtensionWorkflow } from "components/application";

const TABS = {
  APPLICATION: "application",
  DETAILS: "details",
  DOCUMENTS: "documents",
};

const ModificationWorkflow = ({ modificationItem }: { modificationItem: ModificationItem }) => {
  if (modificationItem.modificationType === "amendment") {
    return <AmendmentWorkflow />;
  } else if (modificationItem.modificationType === "extension") {
    return <ExtensionWorkflow />;
  } else {
    return <div>Unsupported modification type! {modificationItem.modificationType}</div>;
  }
};

export const ModificationTabSideNav = ({
  modificationItem,
}: {
  modificationItem: ModificationItem;
}) => {
  return (
    <VerticalTabs defaultValue={TABS.APPLICATION}>
      <Tab icon={<ListIcon />} value={TABS.APPLICATION} label="Application">
        <ModificationWorkflow modificationItem={modificationItem} />
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
