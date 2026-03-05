import { DeliverableTable } from "components/table/tables/DeliverableTable";
import { HorizontalSectionTabs, Tab } from "layout/Tabs";
import React from "react";

import { MOCK_DELIVERABLES } from "mock-data/deliverableMocks";

/* TODO: Probably replace with like Pick<Deliverable, "id" | ... > when schema is defined */
export type Deliverable = {
  id: string;
  name: string;
  demonstrationName: string;
  deliverableType: string;
  dueDate: string;
  status: string;
  state: {
    id: string;
  };
  primaryContact?: {
    id: string;
    fullName: string;
  };
};


export const DeliverablesPage: React.FC = () => {
  /* Data and current user ID is fetched from eventual query */
  const deliverables = MOCK_DELIVERABLES;
  const myDeliverables = deliverables.filter((d) => d.primaryContact?.id === "currentUserId");

  const tabDeliKey = "selectedDeliverableTab";
  let tabValue = "my-deliverables";

  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem(tabDeliKey);
    tabValue = ["my-deliverables", "deliverables"].includes(stored ?? "") ? stored! : tabValue;
    sessionStorage.setItem(tabDeliKey, tabValue);
  }

  return (
    <div className="shadow-md bg-white p-[16px]">
      <h1 className="text-[20px] font-bold mb-[24px] text-brand uppercase border-b-1 pb-[8px]">
        Deliverables
      </h1>
      <HorizontalSectionTabs defaultValue={tabValue} onSelect={(value) => sessionStorage.setItem(tabDeliKey, value)}>
        <Tab label={`My Deliverables (${myDeliverables.length})`} value="my-deliverables">
          <DeliverableTable deliverables={myDeliverables} />
        </Tab>
        <Tab label={`All Deliverables (${deliverables.length})`} value="deliverables">
          <DeliverableTable deliverables={deliverables} />
        </Tab>
      </HorizontalSectionTabs>
    </div>
  );
};
