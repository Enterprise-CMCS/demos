import { DeliverableTable } from "components/table/tables/DeliverableTable";
import { getCurrentUser } from "components/user/UserContext";
import { HorizontalSectionTabs, Tab } from "layout/Tabs";
import React from "react";
import type { Deliverable, Person, PersonType, State } from "demos-server";
import { useSessionTab } from "hooks/useSessionTab";
import { gql, useQuery } from "@apollo/client";

export type GenericDeliverableTableRow = Omit<
  Deliverable,
  "demonstration" | "cmsOwner" | "cmsDocuments" | "stateDocuments"
> & {
  name: string; // APPENDED FOR NOW, PE Toms Deliverables.
  demonstration: Pick<Deliverable["demonstration"], "id" | "name"> & {
    state: Pick<State, "id">;
  };
  cmsOwner: Pick<Deliverable["cmsOwner"], "id"> & {
    person: Pick<Person, "fullName" | "id">;
  };
  cmsDocuments: Pick<Deliverable["cmsDocuments"][number], "id">[];
  stateDocuments: Pick<Deliverable["stateDocuments"][number], "id">[];
};

type DeliverablesPageQueryResult = {
  deliverables: GenericDeliverableTableRow[];
};
type DeliverableTableViewMode = Exclude<PersonType, "non-user-contact">;

export const DELIVERABLES_PAGE_QUERY = gql`
  query GetDeliverablesPage {
    deliverables {
      id
      deliverableType
      name
      demonstration {
        id
        name
        state {
          id
        }
      }
      status
      cmsOwner {
        id
        person {
          id
          fullName
        }
      }
      dueDate
      dueDateType
      expectedToBeSubmitted
      cmsDocuments {
        id
      }
      stateDocuments {
        id
      }
      createdAt
      updatedAt
    }
  }
`;

export const DeliverablesPage: React.FC = () => {
  const { currentUser } = getCurrentUser();
  const rawPersonType = currentUser?.person.personType;
  // Note. currentUser type by default cannot be non-user-contact.
  const viewMode = rawPersonType as DeliverableTableViewMode;
  const { data, loading, error } = useQuery<DeliverablesPageQueryResult>(
    DELIVERABLES_PAGE_QUERY
  );

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
