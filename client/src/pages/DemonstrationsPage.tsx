import React from "react";
import { DemonstrationTable } from "components/table/tables/DemonstrationTable";
import { gql, useQuery } from "@apollo/client";
import {
  Demonstration as ServerDemonstration,
  Amendment,
  Extension,
  State,
  Person,
  User,
} from "demos-server";
import { Tab, HorizontalSectionTabs } from "layout/Tabs";

export const DEMONSTRATIONS_PAGE_QUERY = gql`
  query GetDemonstrationsPage {
    demonstrations {
      id
      name
      status
      state {
        id
        name
      }
      primaryProjectOfficer {
        id
        fullName
      }
      amendments {
        id
        name
        status
      }
      extensions {
        id
        name
        status
      }
    }

    people {
      fullName
    }

    currentUser {
      id
    }
  }
`;

export type DemonstrationAmendment = Pick<Amendment, "id" | "name" | "status">;
export type DemonstrationExtension = Pick<Extension, "id" | "name" | "status">;

export type Demonstration = Pick<ServerDemonstration, "id" | "name" | "status"> & {
  state: Pick<State, "id" | "name">;
  primaryProjectOfficer: Pick<Person, "id" | "fullName">;
  amendments: DemonstrationAmendment[];
  extensions: DemonstrationExtension[];
};

export type DemonstrationsPageQueryResult = {
  demonstrations: Demonstration[];
  people: Pick<Person, "fullName">[];
  currentUser: Pick<User, "id">;
};

export const DemonstrationsPage: React.FC = () => {
  const { data, loading, error } = useQuery<DemonstrationsPageQueryResult>(
    DEMONSTRATIONS_PAGE_QUERY
  );

  const demonstrations = data?.demonstrations || [];
  const myDemonstrations = demonstrations.filter(
    (d) => d.primaryProjectOfficer.id === data?.currentUser.id
  );

  const tabDemoKey = "selectedDemonstrationTab";
  let tabValue = "my-demonstrations";

  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem(tabDemoKey);
    tabValue = ["my-demonstrations", "demonstrations"].includes(stored ?? "") ? stored! : tabValue;
    sessionStorage.setItem(tabDemoKey, tabValue);
  }

  return (
    <div className="shadow-md bg-white p-[16px]">
      <h1 className="text-[20px] font-bold mb-[24px] text-brand uppercase border-b-1 pb-[8px]">
        Demonstrations
      </h1>
      {loading && <div className="p-4">Loading demonstrations...</div>}
      {error && <div className="p-4 text-red-500">Error loading demonstrations.</div>}
      {data && (
        <HorizontalSectionTabs
          defaultValue={tabValue}
          onSelect={(value) => sessionStorage.setItem(tabDemoKey, value)}
        >
          <Tab label={`My Demonstrations (${myDemonstrations.length})`} value="my-demonstrations">
            <DemonstrationTable
              demonstrations={myDemonstrations}
              projectOfficerOptions={data.people}
              emptyRowsMessage="You have no assigned demonstrations at this time."
            />
          </Tab>
          <Tab label={`All Demonstrations (${demonstrations.length})`} value="demonstrations">
            <DemonstrationTable
              demonstrations={demonstrations}
              projectOfficerOptions={data.people}
            />
          </Tab>
        </HorizontalSectionTabs>
      )}
    </div>
  );
};
