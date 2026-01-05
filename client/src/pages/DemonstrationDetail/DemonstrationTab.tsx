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
  OpenFolderIcon,
  StackIcon,
} from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { DocumentTable } from "components/table/tables/DocumentTable";
import {
  Demonstration,
  DemonstrationRoleAssignment,
  Document,
  Person,
  PhaseName,
} from "demos-server";
import { Tab, VerticalTabs } from "layout/Tabs";

import { SummaryDetailsTab } from "./SummaryDetailsTab";
import { useDialog } from "components/dialog/DialogContext";
import { ContactsTab } from "./ContactsTab";
import { useApolloClient } from "@apollo/client/react/hooks/useApolloClient";

type Role = Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
  person: Pick<Person, "fullName" | "id" | "email" | "personType">;
};

export type DemonstrationTabDemonstration = Pick<Demonstration, "id" | "status"> & {
  documents: (Pick<Document, "id" | "name" | "description" | "documentType" | "createdAt"> & {
    owner: {
      person: Pick<Person, "fullName">;
    };
  })[];
  roles: Role[];
  currentPhaseName: PhaseName;
};

export const DemonstrationTab: React.FC<{ demonstration: DemonstrationTabDemonstration }> = ({
  demonstration,
}) => {
  const { showUploadDocumentDialog } = useDialog();
  const client = useApolloClient();

  const refetchApplicationWorkflow = async () => {
    await client.refetchQueries({
      include: [GET_WORKFLOW_DEMONSTRATION_QUERY],
    });
  };

  return (
    <div className="p-[16px]">
      <ApplicationWorkflow demonstrationId={demonstration.id} />
      <VerticalTabs defaultValue="details">
        <Tab icon={<DetailsIcon />} label="Details" value="details">
          <SummaryDetailsTab demonstrationId={demonstration.id} />
        </Tab>
        <Tab icon={<StackIcon />} label="Types (0)" value="demonstrationTypes">
          <TabHeader title="Types" />
          {/* TO DO: Add New button? */}
        </Tab>
        <Tab
          icon={<OpenFolderIcon />}
          label={`Documents (${demonstration.documents?.length ?? 0})`}
          value="documents"
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
          value="contacts"
        >
          <ContactsTab demonstration={demonstration} />
        </Tab>
      </VerticalTabs>
    </div>
  );
};
