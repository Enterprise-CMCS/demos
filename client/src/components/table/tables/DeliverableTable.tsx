import React from "react";
import { gql } from "@apollo/client";
import type { Deliverable, Person, Role, State, Tag, UserType } from "demos-server";

import { DeliverableColumns } from "../columns/DeliverableColumns";
import { Table, type TableProps } from "../Table";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";
import { KeywordSearch } from "../KeywordSearch";
import { sortDeliverablesByDefault } from "util/sortDeliverables";
import { getDeliverableFilterOptions } from "./deliverablesFilterOptions";
import { DeliverableActionButtons } from "./DeliverableActionButtons";

export type DeliverableTableRow = Omit<
  Deliverable,
  | "demonstration"
  | "cmsOwner"
  | "demonstrationTypes"
  | "cmsDocuments"
  | "stateDocuments"
  | "name"
  | "dueDateType"
  | "expectedToBeSubmitted"
  | "deliverableActions"
  | "extensionRequests"
  | "publicComments"
  | "privateComments"
  | "createdAt"
  | "updatedAt"
> & {
  name: string;
  demonstration: Pick<Deliverable["demonstration"], "id" | "name"> & {
    state: Pick<State, "id">;
    demonstrationTypes: {
      demonstrationTypeName: string;
      approvalStatus: "Approved" | "Unapproved";
    }[];
  };
  cmsOwner: Pick<Deliverable["cmsOwner"], "id"> & {
    person: Pick<Person, "fullName" | "id">;
  };
  demonstrationTypes: Tag[];
  submissionDate?: string;
};

export type DeliverablesQueryResult = {
  deliverables: DeliverableTableRow[];
};

export type StateUserDeliverablesQueryResult = {
  currentUser?: {
    person: {
      roles: {
        role: Role;
        demonstration: {
          id: string;
          deliverables: DeliverableTableRow[];
        };
      }[];
    };
  } | null;
};

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
        demonstrationTypes {
          demonstrationTypeName
          approvalStatus
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
      demonstrationTypes {
        tagName
        approvalStatus
      }
    }
  }
`;

export const STATE_USER_DELIVERABLES_PAGE_QUERY = gql`
  query GetStateUserDeliverablesPage {
    currentUser {
      person {
        roles {
          role
          demonstration {
            id
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
                demonstrationTypes {
                  demonstrationTypeName
                  approvalStatus
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
            }
          }
        }
      }
    }
  }
`;

const EMPTY_ROWS_MESSAGE = "There are no assigned Deliverables at this time";
const NO_RESULTS_FOUND = "No deliverables match your search.";

export const formatDeliverableStatus = ({ status }: Pick<Deliverable, "status">) => status;

export const DeliverableTable: React.FC<{
  deliverables: DeliverableTableRow[];
  emptyRowsMessage?: string;
  viewMode: UserType;
}> = ({ deliverables, emptyRowsMessage = EMPTY_ROWS_MESSAGE, viewMode }) => {
  const { demonstrationNameOptions, cmsOwnerOptions } = getDeliverableFilterOptions(deliverables);
  const deliverableColumns = DeliverableColumns({
    viewMode,
    demonstrationNameOptions,
    cmsOwnerOptions,
  });
  const formattedDeliverables = sortDeliverablesByDefault(deliverables).map((deliverable) => ({
    ...deliverable,
    status: formatDeliverableStatus(deliverable),
  }));

  type RenderDeliverableActionButtons = NonNullable<
    TableProps<DeliverableTableRow>["actionButtons"]
  >;

  const renderActionButtons: RenderDeliverableActionButtons = (table) => (
    <DeliverableActionButtons table={table} />
  );

  const actionButtons = viewMode === "demos-state-user" ? undefined : renderActionButtons;

  return (
    <div className="flex flex-col gap-[24px]" data-view-mode={viewMode}>
      {deliverableColumns && (
        <Table<DeliverableTableRow>
          data={formattedDeliverables}
          columns={deliverableColumns}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columnFilter={(table) => <ColumnFilter table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          emptyRowsMessage={emptyRowsMessage}
          noResultsFoundMessage={NO_RESULTS_FOUND}
          actionButtons={actionButtons}
        />
      )}
    </div>
  );
};
