import React from "react";

import { render, screen, within } from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { describe, it, expect, vi, beforeEach } from "vitest";

import { CreateDemonstrationTypesList } from "./CreateDemonstrationTypesList";

describe("CreateDemonstrationTypesList", () => {
  const mockRemoveDemonstrationType = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when there are no demonstration types", () => {
    const { container } = render(
      <CreateDemonstrationTypesList
        demonstrationTypes={[]}
        removeDemonstrationType={mockRemoveDemonstrationType}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the number of types to be added", () => {
    render(
      <CreateDemonstrationTypesList
        demonstrationTypes={[
          {
            demonstrationTypeName: "Type A",
            approvalStatus: "Unapproved",
          },
          {
            demonstrationTypeName: "Type B",
            approvalStatus: "Unapproved",
          },
        ]}
        removeDemonstrationType={mockRemoveDemonstrationType}
      />
    );

    expect(screen.getByText("Types to be added (2)")).toBeInTheDocument();
  });

  it("renders all demonstration types", () => {
    render(
      <CreateDemonstrationTypesList
        demonstrationTypes={[
          {
            demonstrationTypeName: "Type A",
            approvalStatus: "Approved",
          },
          {
            demonstrationTypeName: "Type B",
            approvalStatus: "Unapproved",
          },
          {
            demonstrationTypeName: "Type C",
            approvalStatus: "Approved",
          },
        ]}
        removeDemonstrationType={mockRemoveDemonstrationType}
      />
    );

    expect(screen.getByText("Type A")).toBeInTheDocument();
    expect(screen.getByText("Type B (Unapproved)")).toBeInTheDocument();
    expect(screen.getByText("Type C")).toBeInTheDocument();
  });

  it("displays the Unapproved label only for unapproved types", () => {
    render(
      <CreateDemonstrationTypesList
        demonstrationTypes={[
          {
            demonstrationTypeName: "Approved Type",
            approvalStatus: "Approved",
          },
          {
            demonstrationTypeName: "Unapproved Type",
            approvalStatus: "Unapproved",
          },
        ]}
        removeDemonstrationType={mockRemoveDemonstrationType}
      />
    );

    expect(screen.getByText("Approved Type")).toBeInTheDocument();
    expect(screen.getByText("Unapproved Type (Unapproved)")).toBeInTheDocument();

    expect(
      screen.queryByText("Approved Type (Unapproved)")
    ).not.toBeInTheDocument();
  });

  it("renders a delete button for each demonstration type", () => {
    render(
      <CreateDemonstrationTypesList
        demonstrationTypes={[
          {
            demonstrationTypeName: "Type A",
            approvalStatus: "Approved",
          },
          {
            demonstrationTypeName: "Type B",
            approvalStatus: "Unapproved",
          },
          {
            demonstrationTypeName: "Type C",
            approvalStatus: "Approved",
          },
        ]}
        removeDemonstrationType={mockRemoveDemonstrationType}
      />
    );

    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(3);
  });

  it("calls removeDemonstrationType with the correct type name", async () => {
    const user = userEvent.setup();

    render(
      <CreateDemonstrationTypesList
        demonstrationTypes={[
          {
            demonstrationTypeName: "Type A",
            approvalStatus: "Approved",
          },
          {
            demonstrationTypeName: "Type B",
            approvalStatus: "Unapproved",
          },
        ]}
        removeDemonstrationType={mockRemoveDemonstrationType}
      />
    );

    const typeB = screen.getByText("Type B (Unapproved)").closest("li");

    expect(typeB).not.toBeNull();

    await user.click(
      within(typeB!).getByRole("button", { name: "Delete" })
    );

    expect(mockRemoveDemonstrationType).toHaveBeenCalledWith("Type B");
    expect(mockRemoveDemonstrationType).toHaveBeenCalledTimes(1);
  });

  it("renders the correct number of list items", () => {
    render(
      <CreateDemonstrationTypesList
        demonstrationTypes={[
          {
            demonstrationTypeName: "Type A",
            approvalStatus: "Approved",
          },
          {
            demonstrationTypeName: "Type B",
            approvalStatus: "Unapproved",
          },
        ]}
        removeDemonstrationType={mockRemoveDemonstrationType}
      />
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });
});
