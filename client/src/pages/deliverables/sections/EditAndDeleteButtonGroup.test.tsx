import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EditAndDeleteButtonGroup } from "./EditAndDeleteButtonGroup";

const renderGroup = (
  overrides: Partial<React.ComponentProps<typeof EditAndDeleteButtonGroup>> = {}
) => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(<EditAndDeleteButtonGroup onEdit={onEdit} onDelete={onDelete} {...overrides} />);
  return { onEdit, onDelete };
};

describe("EditAndDeleteButtonGroup", () => {
  it("invokes onEdit and onDelete when enabled", async () => {
    const user = userEvent.setup();
    const { onEdit, onDelete } = renderGroup();

    await user.click(screen.getByTestId("edit-deliverable-button"));
    await user.click(screen.getByTestId("delete-deliverable-button"));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("disables Edit when editDisabled is true", async () => {
    const user = userEvent.setup();
    const { onEdit } = renderGroup({ editDisabled: true });

    const editButton = screen.getByTestId("edit-deliverable-button");
    expect(editButton).toBeDisabled();

    await user.click(editButton);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("disables Delete when deleteDisabled is true", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderGroup({ deleteDisabled: true });

    const deleteButton = screen.getByTestId("delete-deliverable-button");
    expect(deleteButton).toBeDisabled();

    await user.click(deleteButton);
    expect(onDelete).not.toHaveBeenCalled();
  });
});
