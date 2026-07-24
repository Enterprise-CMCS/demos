import { Tab, VerticalTabs } from "layout/Tabs";
import React from "react";
import type {
  ApplicationWorkflowAmendment,
  ApplicationWorkflowExtension,
} from "components/application";
import { AddNewIcon, DetailsIcon, ListIcon, OpenFolderIcon } from "components/icons";
import { ModificationDetailsSummary } from "./ModificationDetailsSummary";
import {
  AmendmentWorkflow,
  ExtensionWorkflow,
  GET_AMENDMENT_WORKFLOW_QUERY,
  GET_EXTENSION_WORKFLOW_QUERY,
} from "components/application";
import { DocumentTable } from "components/table/tables/DocumentTable";
import { IconButton } from "components/button/IconButton";
import { TabHeader } from "components/table/TabHeader";
import { useApolloClient } from "@apollo/client/react/hooks/useApolloClient";
import { useDialog } from "components/dialog/DialogContext";
import { NON_DELIVERABLE_DOCUMENT_TYPES } from "demos-server-constants";

const TABS = {
  APPLICATION: "application",
  DETAILS: "details",
  DOCUMENTS: "documents",
};

export type ModificationItem =
  | (ApplicationWorkflowAmendment & {
      modificationType: "amendment";
      medicaidId: string;
    })
  | (ApplicationWorkflowExtension & {
      modificationType: "extension";
      medicaidId: string;
    });

const ModificationWorkflow = ({ modificationItem }: { modificationItem: ModificationItem }) => {
  if (modificationItem.modificationType === "amendment") {
    return <AmendmentWorkflow key={modificationItem.id} amendment={modificationItem} />;
  }
  return <ExtensionWorkflow key={modificationItem.id} extension={modificationItem} />;
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
      include: [
        modificationItem.modificationType === "amendment"
          ? GET_AMENDMENT_WORKFLOW_QUERY
          : GET_EXTENSION_WORKFLOW_QUERY,
      ],
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
            onClick={() =>
              showUploadDocumentDialog(
                modificationItem.id,
                refetchApplicationWorkflow,
                NON_DELIVERABLE_DOCUMENT_TYPES
              )
            }
          >
            Add Document
          </IconButton>
        </TabHeader>
        <DocumentTable documents={modificationItem.documents} />
      </Tab>
    </VerticalTabs>
  );
};
