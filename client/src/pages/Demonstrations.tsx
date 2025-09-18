import React from "react";
import { DemonstrationTable } from "components/table/tables/DemonstrationTable";
import { gql, useQuery } from "@apollo/client";
import { Amendment, BundleStatus, Extension, State, User } from "demos-server";

export const DEMONSTRATIONS_PAGE_QUERY = gql`
  query GetDemonstrationsPage {
    demonstrations {
      id
      name
      status
      state {
        name
      }
      projectOfficer {
        fullName
        id
      }
      amendments {
        id
        name
        projectOfficer {
          fullName
        }
        status
      }
      extensions {
        id
        name
        projectOfficer {
          fullName
        }
        status
      }
    }

    stateOptions: states {
      id
      name
    }

    projectOfficerOptions: users {
      fullName
    }
  }
`;

export type DemonstrationAmendment = Pick<Amendment, "id" | "name"> & {
  projectOfficer: Pick<User, "fullName">;
  status: BundleStatus;
};
export type DemonstrationExtension = Pick<Extension, "id" | "name"> & {
  projectOfficer: Pick<User, "fullName">;
  status: BundleStatus;
};

export type Demonstration = {
  id: string;
  name: string;
  state: Pick<State, "name">;
  projectOfficer: Pick<User, "fullName" | "id">;
  status: BundleStatus;
  amendments: DemonstrationAmendment[];
  extensions: DemonstrationExtension[];
};

export type DemonstrationsPageQueryResult = {
  demonstrations: Demonstration[];
  projectOfficerOptions: Pick<User, "fullName">[];
  stateOptions: Pick<State, "name" | "id">[];
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
        />
      )}
    </div>
  );
};
