import {
  DELIVERABLES_PAGE_QUERY,
  DeliverableTable,
  DeliverablesQueryResult,
} from "components/table/tables/DeliverableTable";
import { getCurrentUser } from "components/user/UserContext";
import { HorizontalSectionTabs, Tab } from "layout/Tabs";
import React from "react";
import type { UserType } from "demos-server";
import { useSessionTab } from "hooks/useSessionTab";
import { useQuery } from "@apollo/client";
import { Card } from "components/card/Card";

const ASSIGNED_DELIVERABLES_EMPTY_ROWS_MESSAGE = "There are no assigned Deliverables at this time";
const MY_DELIVERABLES_EMPTY_ROWS_MESSAGE = "You have no assigned Deliverables at this time";

const DeliverablesTabs: React.FC<{
  deliverables: DeliverablesQueryResult["deliverables"];
  myDeliverables: DeliverablesQueryResult["deliverables"];
  viewMode: UserType;
}> = ({ deliverables, myDeliverables, viewMode }) => {
  const [tabValue, onTabSelect] = useSessionTab({
    key: "selectedDeliverableTab",
    defaultValue: "my-deliverables",
    allowedValues: ["my-deliverables", "deliverables"],
  });

  return (
    <HorizontalSectionTabs defaultValue={tabValue} onSelect={onTabSelect}>
      <Tab label={`My Deliverables (${myDeliverables.length})`} value="my-deliverables">
        <DeliverableTable
          deliverables={myDeliverables}
          emptyRowsMessage={MY_DELIVERABLES_EMPTY_ROWS_MESSAGE}
          viewMode={viewMode}
        />
      </Tab>
      <Tab label={`All Deliverables (${deliverables.length})`} value="deliverables">
        <DeliverableTable
          deliverables={deliverables}
          emptyRowsMessage={ASSIGNED_DELIVERABLES_EMPTY_ROWS_MESSAGE}
          viewMode={viewMode}
        />
      </Tab>
    </HorizontalSectionTabs>
  );
};

export const DeliverablesPage: React.FC = () => {
  const { currentUser } = getCurrentUser();
  const rawPersonType = currentUser?.person.personType;
  const viewMode = rawPersonType as UserType;
  const isStateUser = rawPersonType === "demos-state-user";
  const { data, loading, error } = useQuery<DeliverablesQueryResult>(DELIVERABLES_PAGE_QUERY);

  const deliverables = data?.deliverables ?? [];
  const myDeliverables = deliverables.filter(
    (deliverable) => deliverable.cmsOwner.id === currentUser?.id
  );

  return (
    <Card title="Deliverables">
      {loading && <div className="p-4">Loading deliverables...</div>}
      {error && <div className="p-4 text-red-500">Error loading deliverables.</div>}

      {data &&
        (isStateUser ? (
          <DeliverableTable
            deliverables={deliverables}
            emptyRowsMessage={ASSIGNED_DELIVERABLES_EMPTY_ROWS_MESSAGE}
            viewMode={viewMode}
          />
        ) : (
          <DeliverablesTabs
            deliverables={deliverables}
            myDeliverables={myDeliverables}
            viewMode={viewMode}
          />
        ))}
    </Card>
  );
};
