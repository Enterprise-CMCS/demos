import {
  DELIVERABLES_PAGE_QUERY,
  DeliverableTable,
  DeliverablesQueryResult,
} from "components/table/tables/DeliverableTable";
import { getCurrentUser } from "components/user/UserContext";
import { HorizontalSectionTabs, Tab } from "layout/Tabs";
import React from "react";
import type { Person, UserType } from "demos-server";
import { useSessionTab } from "hooks/useSessionTab";
import { useQuery } from "@apollo/client";
import { Card } from "components/card/Card";
import { GET_USER_SELECT_OPTIONS_QUERY } from "components/input/select/SelectUsers";

type CmsOwnerPeopleQueryResult = {
  people: Pick<Person, "id" | "fullName" | "personType">[];
};

export const DeliverablesPage: React.FC = () => {
  const { currentUser } = getCurrentUser();
  const rawPersonType = currentUser?.person.personType;
  const viewMode = rawPersonType as UserType;
  const { data, loading, error } = useQuery<DeliverablesQueryResult>(DELIVERABLES_PAGE_QUERY);
  const shouldLoadCmsOwnerPeople = viewMode !== "demos-state-user";
  const {
    data: peopleData,
    loading: peopleLoading,
    error: peopleError,
  } = useQuery<CmsOwnerPeopleQueryResult>(GET_USER_SELECT_OPTIONS_QUERY, {
    skip: !shouldLoadCmsOwnerPeople,
  });

  const deliverables = data?.deliverables ?? [];
  const myDeliverables = deliverables.filter(
    (deliverable) => deliverable.cmsOwner.id === currentUser?.id
  );
  const cmsOwnerPeople = shouldLoadCmsOwnerPeople ? peopleData?.people : undefined;

  const [tabValue, onTabSelect] = useSessionTab({
    key: "selectedDeliverableTab",
    defaultValue: "my-deliverables",
    allowedValues: ["my-deliverables", "deliverables"],
  });

  return (
    <Card title="Deliverables">
      {(loading || peopleLoading) && <div className="p-4">Loading deliverables...</div>}
      {error && <div className="p-4 text-red-500">Error loading deliverables.</div>}
      {peopleError && (
        <div className="p-4 text-red-500">Error loading CMS owner filter options.</div>
      )}

      {data && (!shouldLoadCmsOwnerPeople || peopleData) && (
        <HorizontalSectionTabs defaultValue={tabValue} onSelect={onTabSelect}>
          <Tab label={`My Deliverables (${myDeliverables.length})`} value="my-deliverables">
            <DeliverableTable
              deliverables={myDeliverables}
              cmsOwnerPeople={cmsOwnerPeople}
              emptyRowsMessage="You have no assigned Deliverables at this time"
              viewMode={viewMode}
            />
          </Tab>
          <Tab label={`All Deliverables (${deliverables.length})`} value="deliverables">
            <DeliverableTable
              deliverables={deliverables}
              cmsOwnerPeople={cmsOwnerPeople}
              viewMode={viewMode}
            />
          </Tab>
        </HorizontalSectionTabs>
      )}
    </Card>
  );
};
