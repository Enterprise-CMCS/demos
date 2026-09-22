import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { GET_APPLICATION_TAG_OPTIONS } from "components/tags/useApplicationTagOptions";
import { ImproveSuggestionsDialog } from "./ImproveSuggestionsDialog";

const setup = async () => {
  const onBack = vi.fn();
  const onClose = vi.fn();
  render(
    <TestProvider
      mocks={[
        {
          request: { query: GET_APPLICATION_TAG_OPTIONS },
          result: {
            data: {
              applicationTagOptions: [
                { tagName: "Dental", approvalStatus: "Approved" },
                { tagName: "Behavioral Health", approvalStatus: "Approved" },
              ],
            },
          },
        },
      ]}
    >
      <ImproveSuggestionsDialog tagName="Original" onBack={onBack} onClose={onClose} />
    </TestProvider>
  );
  await screen.findByTestId("checkbox-Dental");
  return { user: userEvent.setup(), onBack, onClose };
};

describe("ImproveSuggestionsDialog", () => {
  it("keeps only the latest selection and allows removing and selecting again", async () => {
    const { user } = await setup();
    const confirm = screen.getByTestId("button-confirm-suggestion");
    expect(confirm).toBeDisabled();
    await user.click(screen.getByTestId("checkbox-Dental"));
    expect(confirm).toBeEnabled();
    await user.click(screen.getByTestId("checkbox-Behavioral Health"));
    expect(screen.getByTestId("checkbox-Dental")).not.toBeChecked();
    expect(screen.queryByTestId("remove-Dental-button")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("remove-Behavioral Health-button"));
    expect(confirm).toBeDisabled();
    await user.click(screen.getByTestId("checkbox-Dental"));
    expect(screen.getByTestId("remove-Dental-button")).toBeInTheDocument();
  });

  it("filters types and only creates an unapproved replacement when no results match", async () => {
    const { user } = await setup();
    await user.click(screen.getByTestId("checkbox-Dental"));
    const search = screen.getByPlaceholderText("Search demonstration types...");
    const create = screen.getByTestId("button-create-tag");
    await user.type(search, "health");
    expect(screen.queryByTestId("checkbox-Dental")).not.toBeInTheDocument();
    expect(screen.getByTestId("checkbox-Behavioral Health")).toBeInTheDocument();
    expect(create).toBeDisabled();
    await user.clear(search);
    await user.type(search, "Healthy Food");
    expect(create).toBeEnabled();
    await user.click(create);
    expect(screen.getByTestId("checkbox-Healthy Food")).toBeChecked();
    expect(screen.getByTestId("checkbox-Dental")).not.toBeChecked();
    expect(screen.getByTestId("remove-Healthy Food-button")).toBeInTheDocument();
    expect(screen.getByTestId("unapproved-warning-banner")).toBeInTheDocument();
    expect(screen.getByTestId("button-confirm-suggestion")).toBeEnabled();
  });

  it("allows Back and closing with a local selection", async () => {
    const { user, onBack, onClose } = await setup();
    await user.click(screen.getByTestId("checkbox-Dental"));
    await user.click(screen.getByTestId("button-back-to-confirm-tags"));
    expect(onBack).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
