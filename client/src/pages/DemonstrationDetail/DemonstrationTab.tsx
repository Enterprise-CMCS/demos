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

  return (
    <div className="p-[16px]">
      <ApplicationWorkflow demonstrationId={demonstration.id} />
      <VerticalTabs defaultValue="details">
        <Tab icon={<DetailsIcon />} label="Details" value="details">
          <SummaryDetailsTab demonstrationId={demonstration.id} />
        </Tab>
        <Tab
          icon={<StackIcon />}
          label={`Types (${demonstration.demonstrationTypes?.length ?? 0})`}
          value="demonstrationTypes"
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
          </TabHeader>{" "}
          <TypesTable demonstrationId={demonstration.id} types={demonstration.demonstrationTypes} />
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
