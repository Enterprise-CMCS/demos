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

export const DeliverablesPage: React.FC = () => {
  const { currentUser } = getCurrentUser();
  const rawPersonType = currentUser?.person.personType;
  const viewMode = rawPersonType as UserType;
  const { data, loading, error } = useQuery<DeliverablesQueryResult>(DELIVERABLES_PAGE_QUERY);

  const deliverables = data?.deliverables ?? [];
  const myDeliverables = deliverables.filter(
    (deliverable) => deliverable.cmsOwner.id === currentUser?.id
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
    </div>
  );
};
