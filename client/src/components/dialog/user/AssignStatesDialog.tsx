import React from "react";

import { gql, TypedDocumentNode, useMutation } from "@apollo/client";
import { Person, State } from "demos-server";
import { STATES_AND_TERRITORIES } from "demos-server-constants";

import { Button } from "components/button";
import { BaseDialog } from "components/dialog/BaseDialog";
import { AutoCompleteMultiselect } from "components/input/select/AutoCompleteMultiselect";
import { Option } from "components/input/select/Select";
import { useToast } from "components/toast";
import { USER_MANAGEMENT_QUERY_NAME } from "components/table/tables/UserManagementTable";

export const ASSIGN_STATES_DIALOG_TITLE = "Assign to State(s)";
export const ASSIGN_STATES_DIALOG_NAME = "assign-states-dialog";
export const ASSIGN_STATES_SELECT_ID = "select-assigned-states";
export const ASSIGN_STATES_SUCCESS_MESSAGE = "Updates have been made successfully";
export const ASSIGN_STATES_ERROR_MESSAGE = "Failed to update State assignments.";

// Territories are included; "All States" is intentionally absent — only CMS and Admin users
// get every State, and their assignments are not editable.
const STATE_OPTIONS: Option[] = STATES_AND_TERRITORIES.map((state) => ({
  value: state.id,
  label: state.name,
}));

// The multiselect renders selections in array order, so keep them in STATE_OPTIONS order to match
// the alphabetical "Assigned to State(s)" table column. Unknown ids are dropped.
const sortByStateName = (stateIds: string[]): string[] =>
  STATE_OPTIONS.filter((option) => stateIds.includes(option.value)).map((option) => option.value);

export type AssignStatesDialogPerson = Pick<Person, "id" | "fullName"> & {
  states: Pick<State, "id">[];
};

export const SET_PERSON_STATES_MUTATION: TypedDocumentNode<
  { setPersonStates: Pick<Person, "id"> & { states: Pick<State, "id" | "name">[] } },
  { personId: string; stateIds: string[] }
> = gql`
  mutation SetPersonStates($personId: ID!, $stateIds: [String!]!) {
    setPersonStates(personId: $personId, stateIds: $stateIds) {
      id
      states {
        id
        name
      }
    }
  }
`;

const sameStates = (initialStateIds: string[], selectedStateIds: string[]): boolean =>
  initialStateIds.length === selectedStateIds.length &&
  initialStateIds.every((stateId) => selectedStateIds.includes(stateId));

export const AssignStatesDialog = ({
  person,
  onClose,
}: {
  person: AssignStatesDialogPerson;
  onClose: () => void;
}) => {
  const { showSuccess, showError } = useToast();
  const [setPersonStates, { loading: saving }] = useMutation(SET_PERSON_STATES_MUTATION, {
    refetchQueries: [USER_MANAGEMENT_QUERY_NAME],
  });

  const initialStateIds = React.useMemo(
    () => sortByStateName(person.states.map((state) => state.id)),
    [person.states]
  );
  const [selectedStateIds, setSelectedStateIds] = React.useState<string[]>(initialStateIds);

  const handleAssign = async () => {
    try {
      await setPersonStates({ variables: { personId: person.id, stateIds: selectedStateIds } });
      showSuccess(ASSIGN_STATES_SUCCESS_MESSAGE);
    } catch (error) {
      console.error("Error assigning states:", error);
      showError(ASSIGN_STATES_ERROR_MESSAGE);
    }
    onClose();
  };

  return (
    <BaseDialog
      name={ASSIGN_STATES_DIALOG_NAME}
      title={ASSIGN_STATES_DIALOG_TITLE}
      onClose={onClose}
      dialogHasChanges={!sameStates(initialStateIds, selectedStateIds)}
      cancelButtonIsDisabled={saving}
      actionButton={
        <Button
          name="button-assign-states"
          disabled={saving || selectedStateIds.length === 0}
          onClick={handleAssign}
        >
          Assign
        </Button>
      }
    >
      <div className="grid grid-cols-[1fr_3fr] gap-2 items-start">
        <div className="flex flex-col gap-xs">
          <p className="text-text-font font-semibold text-field-label">Name</p>
          <p className="text-text-filled">{person.fullName}</p>
        </div>
        <AutoCompleteMultiselect
          id={ASSIGN_STATES_SELECT_ID}
          label="Assigned to State(s)"
          isRequired
          isDisabled={saving}
          options={STATE_OPTIONS}
          values={selectedStateIds}
          onSelect={(stateIds) => setSelectedStateIds(sortByStateName(stateIds))}
        />
      </div>
    </BaseDialog>
  );
};
