import React from "react";
import { describe, it, expect } from "vitest";
import { ApplicationWorkflow } from "./ApplicationWorkflow";
import { render, screen } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ToastProvider } from "components/toast/ToastContext";

describe("ApplicationWorkflow", () => {
  it("renders APPLICATION heading", () => {
    render(
      <ToastProvider>
        <MockedProvider mocks={[]} addTypename={false}>
          <ApplicationWorkflow demonstration={{ status: "under_review" }} />
        </MockedProvider>
      </ToastProvider>
    );
    expect(screen.getByText("APPLICATION")).toBeInTheDocument();
  });
});
