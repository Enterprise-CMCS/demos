import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { SparklyUIPathTags } from "./SparklyUIPathTags";
import { readonlyMockUser } from "mock-data/userMocks";
import { TestProvider } from "test-utils/TestProvider";
import { TagName } from "demos-server";

describe("SparklyUIPathTags", () => {
  it("disables suggestion chip for readonly users", () => {
    const onAcceptSuggestion = vi.fn();

    render(
      <TestProvider currentUser={readonlyMockUser}>
        <SparklyUIPathTags
          selectedTags={[]}
          suggestedTags={["Health Equity" as TagName]}
          onAcceptSuggestion={onAcceptSuggestion}
        />
      </TestProvider>
    );

    const suggestionChip = screen.getByRole("button", {
      name: "Apply suggested tag Health Equity",
    });

    expect(suggestionChip).toBeDisabled();
  });
});
