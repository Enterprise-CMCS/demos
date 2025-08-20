import React from "react";
import {
  DemonstrationTable,
  DemonstrationTableRow,
} from "components/table/tables/DemonstrationTable";
import { gql, useQuery } from "@apollo/client";
import {
  StateOption,
  StatusOption,
  UserOption,
} from "components/table/columns/DemonstrationColumns";

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
      users {
        id
      }
      projectOfficer {
        fullName
      }
      amendments {
        id
        name
        projectOfficer {
          fullName
        }
        amendmentStatus {
          name
        }
      }
      extensions {
        id
        name
        projectOfficer {
          fullName
        }
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

export type DemonstrationsPageQueryResult = {
  demonstrations: DemonstrationTableRow[];
  projectOfficerOptions: UserOption[];
  stateOptions: StateOption[];
  statusOptions: StatusOption[];
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
