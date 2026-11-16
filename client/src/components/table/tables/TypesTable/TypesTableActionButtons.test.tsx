import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ToastContainer } from "components/toast/ToastContainer";

import { TypeTableRow } from "./TypesTable";
import {
  TypesTableActionButtons,
  TYPES_TABLE_ACTION_BUTTONS_QUERY,
  type TypesTableActionButtonsQueryResult,
} from "./TypesTableActionButtons";
import { TestProvider } from "test-utils/TestProvider";
import { cmsMockUser } from "mock-data/userMocks";
import { exportTypeTagRecords } from "util/exportTypeTagRecords";
import {
  buildAssociatedRecordRows,
  sortAssociatedRecordsByDefault,
  TYPE_TAG_ASSOCIATED_RECORDS_QUERY,
} from "../TypeTagAssociatedRecordsTable";
import {
  MOCK_DEMONSTRATION,
  MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION,
} from "mock-data/demonstrationMocks";
import { MockedResponse } from "@apollo/client/testing";

const mockShowRemoveDemonstrationTypesDialog = vi.fn();
const mockShowEditDemonstrationTypeDialog = vi.fn();
vi.mock("components/dialog/DialogContext", () => ({
  useDialog: () => ({
    showRemoveDemonstrationTypesDialog: mockShowRemoveDemonstrationTypesDialog,
    showEditDemonstrationTypeDialog: mockShowEditDemonstrationTypeDialog,
  }),
}));

vi.mock("util/exportTypeTagRecords", () => ({ exportTypeTagRecords: vi.fn() }));

const mockTypeRows: TypeTableRow[] = MOCK_DEMONSTRATION.demonstrationTypes.map((type) => ({
  id: type.demonstrationTypeName,
  typeLabel: type.demonstrationTypeName,
  status: type.status,
  approvalStatus: type.approvalStatus,
  effectivePlainDate: type.effectivePlainDate,
  expirationPlainDate: type.expirationPlainDate,
}));

const ASSOCIATED_TYPE_NAME =
  MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION.demonstrationTypes[0].demonstrationTypeName;

const renderActionButtons = (
  propsOverrides?: Partial<React.ComponentProps<typeof TypesTableActionButtons>>,
  demonstrationOverrides?: Partial<TypesTableActionButtonsQueryResult["demonstration"]>
) => {
  const mocks: MockedResponse[] = [
    {
      request: { query: TYPE_TAG_ASSOCIATED_RECORDS_QUERY },
      result: { data: { demonstrations: [MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION] } },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
    {
      request: {
        query: TYPES_TABLE_ACTION_BUTTONS_QUERY,
        variables: { id: MOCK_DEMONSTRATION.id },
      },
      result: {
        data: {
          demonstration: { ...MOCK_DEMONSTRATION, ...demonstrationOverrides },
        },
      },
    },
  ];

  const props = {
    rows: mockTypeRows,
    selectedRows: [mockTypeRows[0]],
    demonstrationId: MOCK_DEMONSTRATION.id,
    inputDisabled: false,
    ...propsOverrides,
  };

  return render(
    <TestProvider currentUser={cmsMockUser} mocks={mocks}>
      <TypesTableActionButtons {...props} />
      <ToastContainer />
    </TestProvider>
  );
};

describe("TypesTableActionButtons", () => {
  beforeEach(() => {
    vi.mocked(exportTypeTagRecords).mockReset().mockResolvedValue(undefined);
    mockShowRemoveDemonstrationTypesDialog.mockClear();
    mockShowEditDemonstrationTypeDialog.mockClear();
  });

  describe("export", () => {
    it("exports associated records for the filtered types", async () => {
      renderActionButtons({
        rows: [{ ...mockTypeRows[1], typeLabel: ASSOCIATED_TYPE_NAME, id: ASSOCIATED_TYPE_NAME }],
      });
      const user = userEvent.setup();
      await user.click(await screen.findByTestId("export-type-excel"));

      await waitFor(() =>
        expect(exportTypeTagRecords).toHaveBeenCalledWith(
          sortAssociatedRecordsByDefault(
            buildAssociatedRecordRows(
              [MOCK_TYPE_TAG_ASSOCIATED_RECORDS_DEMONSTRATION],
              ASSOCIATED_TYPE_NAME
            )
          )
        )
      );
      await waitFor(() => expect(screen.getByTestId("export-type-excel")).toBeEnabled());
    });

    it("does not download an empty associated-record export", async () => {
      // None of these rows' type names match the associated-records mock's tagged type.
      renderActionButtons({
        rows: mockTypeRows.filter((row) => row.typeLabel !== ASSOCIATED_TYPE_NAME),
      });
      const user = userEvent.setup();

      await user.click(await screen.findByTestId("export-type-excel"));

      expect(
        await screen.findByText("No associated records are available to export.")
      ).toBeInTheDocument();
      expect(exportTypeTagRecords).not.toHaveBeenCalled();
    });

    it("disables export while pending and reports failures before allowing a retry", async () => {
      let rejectExport!: (error: Error) => void;
      vi.mocked(exportTypeTagRecords).mockReturnValueOnce(
        new Promise<void>((_resolve, reject) => {
          rejectExport = reject;
        })
      );
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      try {
        renderActionButtons(
          {
            rows: [
              { ...mockTypeRows[0], typeLabel: ASSOCIATED_TYPE_NAME, id: ASSOCIATED_TYPE_NAME },
            ],
          },
          {}
        );
        const user = userEvent.setup();
        const button = await screen.findByTestId("export-type-excel");
        await user.click(button);
        await waitFor(() => expect(exportTypeTagRecords).toHaveBeenCalledOnce());
        expect(button).toBeDisabled();

        const error = new Error("Export failed");
        await act(async () => rejectExport(error));
        expect(button).toBeEnabled();
        expect(
          screen.getByText("Unable to export associated records. Please try again.")
        ).toBeInTheDocument();
        expect(consoleError).toHaveBeenCalledWith("Unable to export associated records", error);
        await user.click(button);
        await waitFor(() => expect(exportTypeTagRecords).toHaveBeenCalledTimes(2));
      } finally {
        consoleError.mockRestore();
      }
    });
  });

  it("disables action buttons when inputDisabled is true", async () => {
    renderActionButtons({ inputDisabled: true });

    const editButton = await screen.findByTestId("edit-type");
    const deleteButton = screen.getByTestId("delete-type");

    expect(editButton).toBeDisabled();
    expect(deleteButton).toBeDisabled();
  });

  describe("delete button", () => {
    it("calls showRemoveDemonstrationTypesDialog when delete button is clicked", async () => {
      renderActionButtons();
      const user = userEvent.setup();

      const deleteButton = await screen.findByTestId("delete-type");
      await user.click(deleteButton);

      expect(mockShowRemoveDemonstrationTypesDialog).toHaveBeenCalledWith(MOCK_DEMONSTRATION.id, [
        mockTypeRows[0].typeLabel,
      ]);
    });

    it("does not allow deleting all demonstration types when demonstration is approved", async () => {
      renderActionButtons({ selectedRows: mockTypeRows }, { status: "Approved" });

      const deleteButton = await screen.findByTestId("delete-type");
      expect(deleteButton).toBeDisabled();
    });

    it("allows deleting all demonstration types when demonstration is not approved", async () => {
      renderActionButtons({ selectedRows: mockTypeRows }, { status: "Under Review" });

      const deleteButton = await screen.findByTestId("delete-type");
      expect(deleteButton).not.toBeDisabled();
    });

    it("disables delete when a selected demonstration type is linked to a deliverable", async () => {
      renderActionButtons(
        { selectedRows: [mockTypeRows[0]] },
        {
          deliverables: [
            {
              id: "deliverable-1",
              demonstrationTypes: [{ tagName: mockTypeRows[0].typeLabel }],
            },
          ],
        }
      );

      const deleteButton = await screen.findByTestId("delete-type");
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("edit button", () => {
    it("calls showEditDemonstrationTypeDialog when edit button is clicked", async () => {
      renderActionButtons();
      const user = userEvent.setup();
      const editButton = await screen.findByTestId("edit-type");
      await user.click(editButton);

      const expectedDemonstrationType = {
        demonstrationTypeName: mockTypeRows[0].typeLabel,
        status: mockTypeRows[0].status,
        effectivePlainDate: mockTypeRows[0].effectivePlainDate,
        expirationPlainDate: mockTypeRows[0].expirationPlainDate,
        approvalStatus: mockTypeRows[0].approvalStatus,
      };

      expect(mockShowEditDemonstrationTypeDialog).toHaveBeenCalledWith(
        MOCK_DEMONSTRATION.id,
        expectedDemonstrationType
      );
    });

    it("enables edit button when exactly one type is selected", async () => {
      renderActionButtons();

      expect(await screen.findByTestId("edit-type")).toBeEnabled();
    });

    it("disables edit button when no type is selected", async () => {
      renderActionButtons({ selectedRows: [] });

      expect(await screen.findByTestId("edit-type")).toBeDisabled();
    });

    it("disables edit button when multiple types are selected", async () => {
      renderActionButtons({ selectedRows: [mockTypeRows[0], mockTypeRows[1]] });

      expect(await screen.findByTestId("edit-type")).toBeDisabled();
    });
  });
});
