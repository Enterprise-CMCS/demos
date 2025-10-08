import React from "react";
import { DemonstrationTable } from "components/table/tables/DemonstrationTable";
import { gql, useQuery } from "@apollo/client";
import {
  Demonstration as ServerDemonstration,
  Amendment,
  Extension,
  State,
  Person,
  DemonstrationRoleAssignment,
} from "demos-server";
import { Tab, Tabs } from "layout/Tabs";

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
      roles {
        role
        isPrimary
        person {
          id
          fullName
        }
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
  }
`;

export type DemonstrationAmendment = Pick<Amendment, "id" | "name" | "status">;
export type DemonstrationExtension = Pick<Extension, "id" | "name" | "status">;

export type Demonstration = Pick<ServerDemonstration, "id" | "name" | "status"> & {
  state: Pick<State, "id" | "name">;
  roles: (Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
    person: Pick<Person, "fullName" | "id">;
  })[];
  amendments: DemonstrationAmendment[];
  extensions: DemonstrationExtension[];
};

export type DemonstrationsPageQueryResult = {
  demonstrations: Demonstration[];
  people: Pick<Person, "fullName">[];
};

function isMyDemonstration(demonstration: Demonstration) {
  const currentUserId = "1";
  return demonstration.roles.some((role) => role.person.id === currentUserId);
}

export const DemonstrationsPage: React.FC = () => {
  const { data, loading, error } =
    useQuery<DemonstrationsPageQueryResult>(DEMONSTRATIONS_PAGE_QUERY);

  const demonstrations = data?.demonstrations || [];
  const myDemonstrations: Demonstration[] = demonstrations.filter(isMyDemonstration);

  return (
    <div>
      <h1 className="text-[20px] font-bold mb-[24px] text-brand uppercase border-b-1 pb-[8px]">
        Demonstrations
      </h1>
      {loading && <div className="p-4">Loading demonstrations...</div>}
      {error && <div className="p-4 text-red-500">Error loading demonstrations.</div>}
      {data && (
        <Tabs defaultValue="demonstrations">
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
        </Tabs>
      )}
    </div>
  );
};
