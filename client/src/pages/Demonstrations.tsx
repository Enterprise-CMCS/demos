import React from "react";
import { DemonstrationTable } from "components/table/tables/DemonstrationTable";
import { gql, useQuery } from "@apollo/client";
import {
  Amendment,
  DemonstrationStatus,
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
      demonstrationStatus {
        name
      }
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
        amendmentStatus {
          name
        }
      }
      extensions {
        id
        name
        extensionStatus {
          name
        }
      }
    }

    stateOptions: states {
      id
      name
    }

    projectOfficerOptions: users {
      fullName
    }

    statusOptions: demonstrationStatuses {
      name
    }
  }
`;

export type DemonstrationAmendment = Pick<Amendment, "id" | "name"> & {
  amendmentStatus: Pick<DemonstrationStatus, "name">;
};
export type DemonstrationExtension = Pick<Extension, "id" | "name"> & {
  extensionStatus: Pick<DemonstrationStatus, "name">;
};

export type Demonstration = {
  id: string;
  name: string;
  state: Pick<State, "name">;
  roles: (Pick<DemonstrationRoleAssignment, "role" | "isPrimary"> & {
    person: Pick<Person, "fullName" | "id">;
  })[];
  demonstrationStatus: Pick<DemonstrationStatus, "name">;
  amendments: DemonstrationAmendment[];
  extensions: DemonstrationExtension[];
};

export type DemonstrationsPageQueryResult = {
  demonstrations: Demonstration[];
  projectOfficerOptions: Pick<Person, "fullName">[];
  stateOptions: Pick<State, "name" | "id">[];
  statusOptions: Pick<DemonstrationStatus, "name">[];
};

export const Demonstrations: React.FC = () => {
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
          stateOptions={data.stateOptions}
          projectOfficerOptions={data.projectOfficerOptions}
          statusOptions={data.statusOptions}
        />
      )}
    </div>
  );
};
