import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TestProvider } from "test-utils/TestProvider";
import { GET_APPLICATION_TAG_OPTIONS } from "components/tags/useApplicationTagOptions";
import {
  ImproveSuggestionsDialog,
  REPLACE_APPLICATION_TAG_SUGGESTION_MUTATION,
} from "./ImproveSuggestionsDialog";
import { MockedResponse } from "@apollo/client/testing";
import { ToastContainer } from "components/toast/ToastContainer";

const setup = async (mutationMocks: MockedResponse[] = []) => {
  const onBack = vi.fn();
  const onClose = vi.fn();
  const optionsResult = vi.fn(() => ({
    data: {
      applicationTagOptions: [
        { tagName: "Dental", approvalStatus: "Approved" },
        { tagName: "Behavioral Health", approvalStatus: "Approved" },
      ],
    },
  }));
  render(
    <TestProvider
      mocks={[
        {
          request: { query: GET_APPLICATION_TAG_OPTIONS },
          result: optionsResult,
          maxUsageCount: 2,
        },
        ...mutationMocks,
      ]}
    >
      <ToastContainer />
      <ImproveSuggestionsDialog
        applicationId="demo-123"
        tagName="Original"
        onBack={onBack}
        onClose={onClose}
      />
    </TestProvider>
  );
  await screen.findByTestId("checkbox-Dental");
  return { user: userEvent.setup(), onBack, onClose, optionsResult };
};

describe("ImproveSuggestionsDialog", () => {
  it.each(["Dental", "Healthy Food"])(
    "saves replacement %s and refreshes before closing",
    async (newValue) => {
      const mutationResult = vi.fn(() => ({
        data: {
          replaceApplicationTagSuggestion: {
            __typename: "Demonstration",
            id: "demo-123",
            tags: [
              {
                tagName: newValue,
                approvalStatus: newValue === "Dental" ? "Approved" : "Unapproved",
              },
            ],
            suggestedApplicationTags: [],
          },
        },
      }));
      const { user, onClose, optionsResult } = await setup([
        {
          request: {
            query: REPLACE_APPLICATION_TAG_SUGGESTION_MUTATION,
            variables: { applicationId: "demo-123", value: "Original", newValue },
          },
          result: mutationResult,
          delay: 100,
        },
      ]);
      if (newValue === "Dental") {
        await user.click(screen.getByTestId("checkbox-Dental"));
      } else {
        await user.type(screen.getByPlaceholderText("Search demonstration types..."), newValue);
        await user.click(screen.getByTestId("button-create-tag"));
      }
      await user.click(screen.getByTestId("button-confirm-suggestion"));
      expect(screen.getByTestId("button-confirm-suggestion")).toBeDisabled();
      expect(screen.getByTestId("button-back-to-confirm-tags")).toBeDisabled();
      expect(screen.getByTestId("button-dialog-close")).toBeDisabled();
      expect(onClose).not.toHaveBeenCalled();
      await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
      expect(mutationResult).toHaveBeenCalledOnce();
      expect(optionsResult).toHaveBeenCalledTimes(2);
      expect(screen.getByText(`Replaced suggested tag with '${newValue}'`)).toBeInTheDocument();
    }
  );

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

  it("only enables tag creation when the search has no matches", async () => {
    const { user } = await setup();
    const search = screen.getByPlaceholderText("Search demonstration types...");
    const create = screen.getByTestId("button-create-tag");

    await user.type(search, "health");
    expect(create).toBeDisabled();

    await user.clear(search);
    await user.type(search, "Healthy Food");
    expect(create).toBeEnabled();
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
