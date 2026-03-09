import { Tab, VerticalTabs } from "layout/Tabs";
import React from "react";
import { ModificationItem } from "./ModificationTabs";
import { AddNewIcon, DetailsIcon, ListIcon, OpenFolderIcon } from "components/icons";
import { ModificationDetailsSummary } from "./ModificationDetailsSummary";
import { AmendmentWorkflow, ExtensionWorkflow, GET_WORKFLOW_DEMONSTRATION_QUERY } from "components/application";
import { DocumentTable } from "components/table/tables/DocumentTable";
import { IconButton } from "components/button/IconButton";
import { TabHeader } from "components/table/TabHeader";
import { DEMONSTRATION_DETAIL_QUERY } from "../DemonstrationDetail";
import { useApolloClient } from "@apollo/client/react/hooks/useApolloClient";
import { useDialog } from "components/dialog/DialogContext";

const TABS = {
  APPLICATION: "application",
  DETAILS: "details",
  DOCUMENTS: "documents",
};

const ModificationWorkflow = ({ modificationItem }: { modificationItem: ModificationItem }) => {
  if (modificationItem.modificationType === "amendment") {
    return <AmendmentWorkflow key={modificationItem.id} amendmentId={modificationItem.id} />;
  } else if (modificationItem.modificationType === "extension") {
    return <ExtensionWorkflow key={modificationItem.id} extensionId={modificationItem.id} />;
  } else {
    return <div>Unsupported modification type! {modificationItem.modificationType}</div>;
  }
};

export const ModificationTabSideNav = ({
  modificationItem,
}: {
  modificationItem: ModificationItem;
}) => {
  const { showUploadDocumentDialog } = useDialog();
  const client = useApolloClient();
  const refetchApplicationWorkflow = async () => {
    await client.refetchQueries({
      include: [DEMONSTRATION_DETAIL_QUERY, GET_WORKFLOW_DEMONSTRATION_QUERY],
    });
  };
  return (
    <VerticalTabs defaultValue={TABS.APPLICATION}>
      <Tab icon={<ListIcon />} value={TABS.APPLICATION} label="Application">
        <ModificationWorkflow modificationItem={modificationItem} />
      </Tab>
      <Tab icon={<DetailsIcon />} value={TABS.DETAILS} label="Details">
        <ModificationDetailsSummary modificationItem={modificationItem} />
      </Tab>
      <Tab
        icon={<OpenFolderIcon />}
        value={TABS.DOCUMENTS}
        label={`Documents (${modificationItem.documents?.length ?? 0})`}
      >
        <TabHeader title="Documents">
          <IconButton
            icon={<AddNewIcon />}
            name="add-new-document"
            size="small"
            onClick={() => showUploadDocumentDialog(modificationItem.id, refetchApplicationWorkflow)}
          >
            Add Document
          </IconButton>
        </TabHeader>
        <DocumentTable applicationId={modificationItem.id} documents={modificationItem.documents} />
      </Tab>
    </VerticalTabs>
  );
};
