import React from "react";

import { TestProvider } from "test-utils/TestProvider";
import { describe, expect, it } from "vitest";

import { render, screen, waitFor } from "@testing-library/react";

import { ApplicationWorkflow } from "./ApplicationWorkflow";

const MOCK_DEMONSTRATION_ID = "mockDemonstrationId";

describe("ApplicationWorkflow", () => {
  it("renders APPLICATION heading", () => {
    render(
      <TestProvider>
        <ApplicationWorkflow demonstrationId={MOCK_DEMONSTRATION_ID} />
      </TestProvider>
    );
    waitFor(() => {
      expect(screen.getByText("APPLICATION")).toBeInTheDocument();
    });
  });
});
