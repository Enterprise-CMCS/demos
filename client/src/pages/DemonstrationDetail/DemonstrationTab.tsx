import React from "react";

import {
  ApplicationWorkflow,
  GET_WORKFLOW_DEMONSTRATION_QUERY,
} from "components/application/ApplicationWorkflow";
import { IconButton } from "components/button";
import {
  AddNewIcon,
  CharacteristicIcon,
  DetailsIcon,
  FileIcon,
  ListIcon,
  OpenFolderIcon,
  StackIcon,
} from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { DocumentTable } from "components/table/tables/DocumentTable";
import {
  Demonstration,
  DemonstrationRoleAssignment,
  DemonstrationTypeAssignment,
  Document,
  Person,
  PhaseName,
} from "demos-server";
import { Tab, VerticalTabs } from "layout/Tabs";
import { SummaryDetailsTab } from "./SummaryDetailsTab";
import { useDialog } from "components/dialog/DialogContext";
import { ContactsTab } from "./ContactsTab";
import { useApolloClient } from "@apollo/client/react/hooks/useApolloClient";
import { TypesTable } from "components/table/tables/TypesTable";

type Role = Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
  person: Pick<Person, "fullName" | "id" | "email" | "personType">;
};

export type DemonstrationDetailDemonstrationType = Pick<
  DemonstrationTypeAssignment,
  "demonstrationTypeName" | "status" | "effectiveDate" | "expirationDate" | "createdAt"
>;

export type DemonstrationTabDemonstration = Pick<Demonstration, "id" | "status"> & {
  demonstrationTypes: DemonstrationDetailDemonstrationType[];
  documents: (Pick<Document, "id" | "name" | "description" | "documentType" | "createdAt"> & {
    owner: {
      person: Pick<Person, "fullName">;
    };
  })[];
  roles: Role[];
  currentPhaseName: PhaseName;
};

const TAB = {
  DELIVERABLES: "deliverables",
  APPLICATION: "application",
  DETAILS: "details",
  DEMONSTRATION_TYPES: "demonstrationTypes",
  DOCUMENTS: "documents",
  CONTACTS: "contacts",
} as const;

export const DemonstrationTab: React.FC<{ demonstration: DemonstrationTabDemonstration }> = ({
  demonstration,
}) => {
  const { showUploadDocumentDialog, showApplyDemonstrationTypesDialog } = useDialog();
  const client = useApolloClient();

  const refetchApplicationWorkflow = async () => {
    await client.refetchQueries({
      include: [GET_WORKFLOW_DEMONSTRATION_QUERY],
    });
  };

  const isDemonstrationApproved = demonstration.status === "Approved";
  const defaultTab = isDemonstrationApproved ? TAB.DELIVERABLES : TAB.APPLICATION;

  return (
    <div className="p-[16px]">
      <VerticalTabs defaultValue={defaultTab}>
        <Tab
          icon={<FileIcon />}
          label="Deliverables"
          value={TAB.DELIVERABLES}
          shouldRender={isDemonstrationApproved}
        >
          <div></div>
        </Tab>
        <Tab icon={<ListIcon />} label="Applications" value={TAB.APPLICATION}>
          <ApplicationWorkflow demonstrationId={demonstration.id} />
        </Tab>
        <Tab icon={<DetailsIcon />} label="Details" value={TAB.DETAILS}>
          <SummaryDetailsTab demonstrationId={demonstration.id} />
        </Tab>
        <Tab
          icon={<StackIcon />}
          label={`Types (${demonstration.demonstrationTypes?.length ?? 0})`}
          value={TAB.DEMONSTRATION_TYPES}
        >
          <TabHeader title="Types">
            <IconButton
              icon={<AddNewIcon />}
              name="button-apply-demonstration-types"
              size="small"
              onClick={() => showApplyDemonstrationTypesDialog(demonstration.id)}
            >
              Apply Type(s)
            </IconButton>
          </TabHeader>
          <TypesTable demonstration={demonstration} />
        </Tab>
        <Tab
          icon={<OpenFolderIcon />}
          label={`Documents (${demonstration.documents?.length ?? 0})`}
          value={TAB.DOCUMENTS}
        >
          <TabHeader title="Documents">
            <IconButton
              icon={<AddNewIcon />}
              name="add-new-document"
              size="small"
              onClick={() => showUploadDocumentDialog(demonstration.id, refetchApplicationWorkflow)}
            >
              Add Document
            </IconButton>
          </TabHeader>
          <DocumentTable applicationId={demonstration.id} documents={demonstration.documents} />
        </Tab>
        <Tab
          icon={<CharacteristicIcon />}
          label={`Contacts (${demonstration.roles?.length ?? 0})`}
          value={TAB.CONTACTS}
        >
          <ContactsTab demonstration={demonstration} />
        </Tab>
      </VerticalTabs>
    </div>
  );
};
