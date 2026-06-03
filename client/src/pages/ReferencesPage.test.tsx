import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { ReferencesPage } from "./ReferencesPage";
import { DialogProvider } from "components/dialog/DialogContext";
import { ToastProvider } from "components/toast";
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { GET_REFERENCES_QUERY } from "components/table/tables/ReferencesTable";

const getReferencesQueryMock: MockedResponse[] = [
  {
    request: {
      query: GET_REFERENCES_QUERY,
    },
    result: {
      data: {
        references: [],
      },
    },
  },
];

describe("ReferencesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithProviders = () => {
    return render(
      <DialogProvider>
        <ToastProvider>
          <MockedProvider mocks={getReferencesQueryMock}>
            <ReferencesPage />
          </MockedProvider>
        </ToastProvider>
      </DialogProvider>
    );
  };

  it("renders the page with title", () => {
    renderWithProviders();

    expect(screen.getByText("References")).toBeInTheDocument();
  });

  it("renders the references table", async () => {
    renderWithProviders();

    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});
