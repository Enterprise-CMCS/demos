import React from "react";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CreateDemonstrationDialog } from "./CreateDemonstrationDialog";

const getCurrentUserMock = vi.fn();
const createDemonstrationDialogContentMock = vi.fn();

vi.mock("components/user/UserContext", () => ({
  getCurrentUser: () => getCurrentUserMock(),
}));

vi.mock("./CreateDemonstrationDialogContent", () => ({
  CreateDemonstrationDialogContent: (props: {
    initialDemonstration: {
      name: string;
      description: string;
      stateId: string;
      sdgDivision?: string;
      projectOfficerUserId: string;
    };
  }) => {
    createDemonstrationDialogContentMock(props);
    return <div data-testid="create-demonstration-dialog-content" />;
  },
}));

describe("CreateDemonstrationDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentUserMock.mockReturnValue({
      currentUser: {
        id: "test-current-user-id",
      },
    });
  });

  it("renders the content component", () => {
    render(<CreateDemonstrationDialog />);

    expect(screen.getByTestId("create-demonstration-dialog-content")).toBeInTheDocument();
  });

  it("passes an empty initial demonstration seeded with the current user", () => {
    render(<CreateDemonstrationDialog />);

    expect(createDemonstrationDialogContentMock).toHaveBeenCalledWith({
      initialDemonstration: {
        name: "",
        description: "",
        stateId: "",
        sdgDivision: undefined,
        projectOfficerUserId: "test-current-user-id",
      },
    });
  });
});
