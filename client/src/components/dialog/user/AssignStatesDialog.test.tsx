import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { MockedResponse } from "@apollo/client/testing";
import { TestProvider } from "test-utils/TestProvider";
import { ToastContainer } from "components/toast";
import {
  AssignStatesDialog,
  AssignStatesDialogPerson,
  ASSIGN_STATES_SUCCESS_MESSAGE,
  SET_PERSON_STATES_MUTATION,
} from "./AssignStatesDialog";

const TESS: AssignStatesDialogPerson = {
  id: "person-1",
  fullName: "Tess Davenport",
  states: [{ id: "OH" }, { id: "MI" }],
};

const UNASSIGNED: AssignStatesDialogPerson = {
  id: "person-2",
  fullName: "Zoe Adams",
  states: [],
};

const buildSetStatesMock = (personId: string, stateIds: string[]): MockedResponse => ({
  request: { query: SET_PERSON_STATES_MUTATION, variables: { personId, stateIds } },
  result: {
    data: {
      setPersonStates: {
        id: personId,
        states: stateIds.map((id) => ({ id, name: id })),
      },
    },
  },
});

const setup = (person: AssignStatesDialogPerson, mocks: MockedResponse[] = []) => {
  const onClose = vi.fn();
  render(
    <TestProvider mocks={mocks}>
      <AssignStatesDialog person={person} onClose={onClose} />
      <ToastContainer />
    </TestProvider>
  );
  return { onClose };
};

const getStateSelect = () => screen.getByTestId("select-assigned-states");
const getAssignButton = () => screen.getByTestId("button-assign-states");

// The multiselect only renders its selection summary once the option list is closed.
const closeStateList = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("heading", { name: "Assign to State(s)" }));

describe("AssignStatesDialog", () => {
  it("renders the title, the person's name, and their current states alphabetically", () => {
    setup(TESS);

    expect(screen.getByText("Assign to State(s)")).toBeInTheDocument();
    expect(screen.getByText("Tess Davenport")).toBeInTheDocument();
    expect(getStateSelect()).toHaveValue("Michigan, Ohio");
  });

  it("lists all States and Territories alphabetically without an All States option", async () => {
    const user = userEvent.setup();
    setup(UNASSIGNED);

    await user.click(getStateSelect());

    const options = within(screen.getByRole("listbox"))
      .getAllByRole("option")
      .map((option) => option.textContent);
    expect(options).not.toContain("All States");
    expect(options[0]).toBe("Alabama");
    expect([...options].sort((a, b) => (a ?? "").localeCompare(b ?? ""))).toEqual(options);
  });

  it("disables Assign until at least one State is selected", async () => {
    const user = userEvent.setup();
    setup(UNASSIGNED);

    expect(getAssignButton()).toBeDisabled();

    await user.click(getStateSelect());
    await user.click(screen.getByRole("checkbox", { name: "Ohio" }));

    expect(getAssignButton()).toBeEnabled();
  });

  it("keeps selected States in alphabetical order regardless of click order", async () => {
    const user = userEvent.setup();
    setup(UNASSIGNED);

    await user.click(getStateSelect());
    await user.click(screen.getByRole("checkbox", { name: "Pennsylvania" }));
    await user.click(screen.getByRole("checkbox", { name: "Michigan" }));
    await user.click(screen.getByRole("checkbox", { name: "Ohio" }));
    await closeStateList(user);

    expect(getStateSelect()).toHaveValue("Michigan, Ohio, Pennsylvania");
  });

  it("submits the selection, closes, and shows the success toast", async () => {
    const user = userEvent.setup();
    const { onClose } = setup(TESS, [buildSetStatesMock("person-1", ["MI", "OH", "PA"])]);

    await user.click(getStateSelect());
    await user.click(screen.getByRole("checkbox", { name: "Pennsylvania" }));
    await closeStateList(user);
    await user.click(getAssignButton());

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(await screen.findByText(ASSIGN_STATES_SUCCESS_MESSAGE)).toBeInTheDocument();
  });

  it("closes without confirmation when Cancel is clicked and nothing changed", async () => {
    const user = userEvent.setup();
    const { onClose } = setup(TESS);

    await user.click(screen.getByTestId("button-dialog-cancel"));

    expect(onClose).toHaveBeenCalled();
  });

  it("prompts for confirmation when Cancel is clicked after a change", async () => {
    const user = userEvent.setup();
    const { onClose } = setup(TESS);

    await user.click(getStateSelect());
    await user.click(screen.getByRole("checkbox", { name: "Pennsylvania" }));
    await closeStateList(user);
    await user.click(screen.getByTestId("button-dialog-cancel"));

    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByText("Are you sure?")).toBeInTheDocument();
  });
});
