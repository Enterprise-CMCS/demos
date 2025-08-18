import React from "react";
import {
  DemonstrationTable,
  DemonstrationTableItem,
} from "components/table/tables/DemonstrationTable";
import { gql, useQuery } from "@apollo/client";

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
  }
`;

export type DemonstrationsPage = {
  demonstrations: DemonstrationTableItem[];
};

export const Demonstrations: React.FC = () => {
  const { data, loading, error } = useQuery<DemonstrationsPage>(DEMONSTRATIONS_PAGE_QUERY);

  const demonstrations = data?.demonstrations;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-brand uppercase border-b-1">Demonstrations</h1>
      {loading && <div className="p-4">Loading demonstrations...</div>}
      {error && <div className="p-4 text-red-500">Error loading</div>}
      {demonstrations && <DemonstrationTable demonstrations={demonstrations} />}
    </div>
  );
};
