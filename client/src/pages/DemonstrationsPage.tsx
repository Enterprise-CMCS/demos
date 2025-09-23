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

export const DEMONSTRATIONS_PAGE_QUERY = gql`
  query GetDemonstrationsPage {
    demonstrations {
      id
      name
      status
      state {
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
  state: Pick<State, "name">;
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

export const DemonstrationsPage: React.FC = () => {
  const { data, loading, error } =
    useQuery<DemonstrationsPageQueryResult>(DEMONSTRATIONS_PAGE_QUERY);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-brand uppercase border-b-1">Demonstrations</h1>
      {loading && <div className="p-4">Loading demonstrations...</div>}
      {error && <div className="p-4 text-red-500">Error loading</div>}
      {data && (
        <DemonstrationTable
          demonstrations={data.demonstrations}
          projectOfficerOptions={data.people}
        />
      )}
    </div>
  );
};
