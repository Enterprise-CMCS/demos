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

export const DeliverablesPage: React.FC = () => {
  const { currentUser } = getCurrentUser();
  const rawPersonType = currentUser?.person.personType;
  const viewMode = rawPersonType as UserType;
  const isStateUser = viewMode === "demos-state-user";
  const { data, loading, error } = useQuery<DeliverablesQueryResult>(DELIVERABLES_PAGE_QUERY);

  const deliverables = data?.deliverables ?? [];
  const myDeliverables = deliverables.filter(
    (deliverable) => deliverable.cmsOwner.id === currentUser?.id
  );
  const stateDeliverables = deliverables.filter((deliverable) =>
    deliverable.demonstration.roles?.some(
      (role) => role.role === "State Point of Contact" && role.person.id === currentUser?.person.id
    )
  );

  const [tabValue, onTabSelect] = useSessionTab({
    key: "selectedDeliverableTab",
    defaultValue: "my-deliverables",
    allowedValues: ["my-deliverables", "deliverables"],
  });

  return (
    <Card title="Deliverables">
      {loading && <div className="p-4">Loading deliverables...</div>}
      {error && <div className="p-4 text-red-500">Error loading deliverables.</div>}

      {data && isStateUser && (
        <DeliverableTable deliverables={stateDeliverables} viewMode={viewMode} />
      )}

      {data && !isStateUser && (
        <HorizontalSectionTabs defaultValue={tabValue} onSelect={onTabSelect}>
          <Tab label={`My Deliverables (${myDeliverables.length})`} value="my-deliverables">
            <DeliverableTable
              deliverables={myDeliverables}
              emptyRowsMessage="You have no assigned Deliverables at this time"
              viewMode={viewMode}
            />
          </Tab>
          <Tab label={`All Deliverables (${deliverables.length})`} value="deliverables">
            <DeliverableTable deliverables={deliverables} viewMode={viewMode} />
          </Tab>
        </HorizontalSectionTabs>
      )}
    </Card>
  );
};
