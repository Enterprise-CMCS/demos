import { DeliverableTable } from "components/table/tables/DeliverableTable";
import { getCurrentUser } from "components/user/UserContext";
import { HorizontalSectionTabs, Tab } from "layout/Tabs";
import React from "react";
import { PersonType } from "demos-server";
import { useSessionTab } from "hooks/useSessionTab";

import { MOCK_DELIVERABLES } from "mock-data/deliverableMocks";

/* TODO: Probably replace with Pick<Deliverable, "id" | ... > when schema is defined */
export type Deliverable = {
  id: string;
  deliverableName: string;
  demonstrationName: string;
  deliverableType: string;
  cmsOwner: string;
  dueDate: string;
  submissionDate?: string;
  status: string;
  extensionRequested?: boolean;
  resubmissionCount?: number;
  state: {
    id: string;
  };
  primaryContact?: {
    id: string;
    fullName: string;
  };
};

type DeliverablesPageQueryResult = {
  deliverables: Deliverable[];
  currentUserId: string;
};
type DeliverableTableViewMode = Exclude<PersonType, "non-user-contact">;

export const DeliverablesPage: React.FC = () => {
  const { currentUser } = getCurrentUser();
  const rawPersonType = currentUser?.person.personType;
  // Note. currentUser type by default cannot be non-user-contact.
  const viewMode = rawPersonType as DeliverableTableViewMode;
  // Placeholder query-state shape until this page is wired to real API data.
  const [loading] = React.useState(false);
  const [error] = React.useState<Error | undefined>(undefined);
  const [data] = React.useState<DeliverablesPageQueryResult>({
    deliverables: MOCK_DELIVERABLES,
    currentUserId: "dustyrhodes",
  });

  // For when we get the backend working. Based on demo table
  // const { data, loading, error } = useQuery<DeliverablesPageQueryResult>(
  //   DELIVERABLES_PAGE_QUERY
  // );

  const deliverables = data?.deliverables ?? [];
  const myDeliverables = deliverables.filter(
    (deliverable) => deliverable.primaryContact?.id === data?.currentUserId
  );

  const [tabValue, onTabSelect] = useSessionTab({
    key: "selectedDeliverableTab",
    defaultValue: "my-deliverables",
    allowedValues: ["my-deliverables", "deliverables"],
  });

  return (
    <div className="shadow-md bg-white p-[16px]">
      <h1 className="text-[20px] font-bold mb-[24px] text-brand uppercase border-b-1 pb-[8px]">
        Deliverables
      </h1>

      {loading && <div className="p-4">Loading deliverables...</div>}
      {error && <div className="p-4 text-red-500">Error loading deliverables.</div>}

      {data && (
        <HorizontalSectionTabs
          defaultValue={tabValue}
          onSelect={onTabSelect}
        >
          <Tab label={`My Deliverables (${myDeliverables.length})`} value="my-deliverables">
            <DeliverableTable
              deliverables={myDeliverables}
              emptyRowsMessage="You have no assigned Deliverables at this time"
              viewMode={viewMode}
            />
          </Tab>
          <Tab label={`All Deliverables (${deliverables.length})`} value="deliverables">
            <DeliverableTable
              deliverables={deliverables}
              viewMode={viewMode}
            />
          </Tab>
        </HorizontalSectionTabs>
      )}
    </div>
  );
};
