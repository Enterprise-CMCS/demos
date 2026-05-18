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
  extensionRequests: Pick<Deliverable["extensionRequests"][number], "id" | "status">[];
  deliverableActions: Pick<Deliverable["deliverableActions"][number], "id" | "actionType">[];
};

export type FormattedDeliverableTableRow = DeliverableTableRow & {
  combinedStatus: string;
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
      extensionRequests {
        id
        status
      }
      deliverableActions {
        id
        actionType
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
              extensionRequests {
                id
                status
              }
              deliverableActions {
                id
                actionType
              }
            }
          }
        }
      }
    }
  }
`;

const EMPTY_ROWS_MESSAGE = "There are no assigned Deliverables at this time";
const NO_RESULTS_FOUND = "No deliverables match your search.";

const FINAL_STATUSES = ["Accepted", "Approved", "Received and Filed"];

export const formatDeliverableStatus = (
  deliverable: Pick<
    DeliverableTableRow,
    "status" | "deliverableActions" | "extensionRequests"
  >
) => {
  const { status, deliverableActions, extensionRequests } = deliverable;

  // Final statuses always display as-is
  if (FINAL_STATUSES.includes(status)) {
    return status;
  }

  const resubmissionsRequested = deliverableActions.filter(
    (action) => action.actionType === "Requested Resubmission"
  ).length;

  const hasOpenExtensionRequest = extensionRequests.some(
    (request) => request.status === "Requested"
  );

  let formattedStatus = status;

  if (resubmissionsRequested > 0) {
    formattedStatus += ` (${resubmissionsRequested})`;
  }

  if (hasOpenExtensionRequest) {
    formattedStatus += " - Extension Requested";
  }

  return formattedStatus;
};

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
    combinedStatus: formatDeliverableStatus(deliverable),
  }));

  type RenderDeliverableActionButtons = NonNullable<
    TableProps<FormattedDeliverableTableRow>["actionButtons"]
  >;

  const renderActionButtons: RenderDeliverableActionButtons = (table) => (
    <DeliverableActionButtons table={table} />
  );

  const actionButtons = viewMode === "demos-state-user" ? undefined : renderActionButtons;

  return (
    <div className="flex flex-col gap-[24px]" data-view-mode={viewMode}>
      {deliverableColumns && (
        <Table<FormattedDeliverableTableRow>
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
