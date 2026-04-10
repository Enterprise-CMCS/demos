import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import {
  ADD_DELIVERABLE_SLOT_DIALOG_TITLE,
  AddDeliverableSlotDialog,
} from "components/dialog/deliverable";
import { SELECT_DEMONSTRATION_TYPE_NAME } from "components/dialog/deliverable/fields/DemonstrationTypeField";
import { DELIVERABLE_TYPE_SELECT_NAME } from "components/dialog/deliverable/fields/DeliverableTypeField";
import { personMocks } from "mock-data/personMocks";
import {
  AddDeliverableSlotDemonstration,
  buildAddDeliverableSlotPayloads,
  getQuarterlyDeliverableSlotName,
} from "./AddDeliverableSlotDialog";
import { TestProvider } from "test-utils/TestProvider";

const TEST_DEMO_ID = "demo-123";

const MOCK_DEMONSTRATION_TYPES: string[] = [
  "Aggregate Cap",
  "Annual Limits",
  "Basic Health Plan (BHP)",
];
const DEFAULT_DEMONSTRATION: AddDeliverableSlotDemonstration = {
  id: TEST_DEMO_ID,
  demonstrationTypes: MOCK_DEMONSTRATION_TYPES,
  effectiveDate: new Date("2024-01-01"),
  expirationDate: new Date("2026-12-31"),
};

describe("AddDeliverableSlotDialog", () => {
  const setup = (demonstrationOverrides?: Partial<AddDeliverableSlotDemonstration>) => {
    const onClose = vi.fn();

    const demonstrationWithOverrides = {
      ...DEFAULT_DEMONSTRATION,
      ...demonstrationOverrides,
    };

    render(
      <TestProvider mocks={personMocks}>
        <AddDeliverableSlotDialog onClose={onClose} demonstration={demonstrationWithOverrides} />
      </TestProvider>
    );

    return { onClose };
  };

  it("renders with the correct title", () => {
    setup();

    expect(screen.getByText(ADD_DELIVERABLE_SLOT_DIALOG_TITLE)).toBeInTheDocument();
  });

  it("renders the confirm button", () => {
    setup();

    expect(screen.getByTestId("button-add-deliverable-slot-confirm")).toBeInTheDocument();
  });

  it("calls onClose when the cancel button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.click(screen.getByTestId("button-dialog-cancel"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the demonstration type field", () => {
    setup();

    expect(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME)).toBeInTheDocument();
  });

  it("demonstration type field is not required when no deliverable type is selected", () => {
    setup();

    expect(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME)).not.toBeRequired();
  });

  it.each(["Implementation Plan", "Monitoring Protocol"])(
    "demonstration type field is required when deliverable type is %s",
    async (deliverableType) => {
      const user = userEvent.setup();
      setup();

      await user.click(screen.getByTestId(DELIVERABLE_TYPE_SELECT_NAME));
      await user.click(screen.getByText(deliverableType));

      expect(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME)).toBeRequired();
    }
  );

  it("demonstration type field is not required for other deliverable types", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByTestId(DELIVERABLE_TYPE_SELECT_NAME));
    await user.click(screen.getByText("Annual Budget Neutrality Report"));

    expect(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME)).not.toBeRequired();
  });

  it("passes available demonstration type options to the field", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByTestId(SELECT_DEMONSTRATION_TYPE_NAME));

    MOCK_DEMONSTRATION_TYPES.forEach((type) => {
      expect(screen.getByText(type)).toBeInTheDocument();
    });
  });
});

describe("getQuarterlyDeliverableSlotName", () => {
  it("formats the name as DYXQY {Deliverable Name}", () => {
    expect(getQuarterlyDeliverableSlotName(3, 2, "Quarterly Report")).toBe(
      "DY3Q2 Quarterly Report"
    );
  });
});

describe("buildAddDeliverableSlotPayloads", () => {
  it("returns a single payload when schedule type is Single", () => {
    const formData = {
      deliverableName: "My Deliverable",
      cmsOwnerId: "user-1",
      deliverableType: "Annual Budget Neutrality Report",
      scheduleType: "Single" as const,
      dueDate: "2026-04-01",
      quarterlyDueDates: ["", "", "", ""],
      demonstrationTypes: ["Aggregate Cap"],
    };

    expect(buildAddDeliverableSlotPayloads(TEST_DEMO_ID, 2, formData)).toEqual([
      {
        deliverableName: "My Deliverable",
        cmsOwnerId: "user-1",
        deliverableType: "Annual Budget Neutrality Report",
        dueDate: "2026-04-01",
        demonstrationTypes: ["Aggregate Cap"],
        demonstrationId: TEST_DEMO_ID,
      },
    ]);
  });

  it("returns four quarterly payloads when schedule type is Quarterly", () => {
    const formData = {
      deliverableName: "My Deliverable",
      cmsOwnerId: "user-1",
      deliverableType: "Annual Budget Neutrality Report",
      scheduleType: "Quarterly" as const,
      dueDate: "",
      quarterlyDueDates: ["2026-01-15", "2026-04-15", "2026-07-15", "2026-10-15"],
      demonstrationTypes: ["Aggregate Cap"],
    };

    expect(buildAddDeliverableSlotPayloads(TEST_DEMO_ID, 2, formData)).toEqual([
      {
        deliverableName: "DY2Q1 My Deliverable",
        cmsOwnerId: "user-1",
        deliverableType: "Annual Budget Neutrality Report",
        dueDate: "2026-01-15",
        demonstrationTypes: ["Aggregate Cap"],
        demonstrationId: TEST_DEMO_ID,
      },
      {
        deliverableName: "DY2Q2 My Deliverable",
        cmsOwnerId: "user-1",
        deliverableType: "Annual Budget Neutrality Report",
        dueDate: "2026-04-15",
        demonstrationTypes: ["Aggregate Cap"],
        demonstrationId: TEST_DEMO_ID,
      },
      {
        deliverableName: "DY2Q3 My Deliverable",
        cmsOwnerId: "user-1",
        deliverableType: "Annual Budget Neutrality Report",
        dueDate: "2026-07-15",
        demonstrationTypes: ["Aggregate Cap"],
        demonstrationId: TEST_DEMO_ID,
      },
      {
        deliverableName: "DY2Q4 My Deliverable",
        cmsOwnerId: "user-1",
        deliverableType: "Annual Budget Neutrality Report",
        dueDate: "2026-10-15",
        demonstrationTypes: ["Aggregate Cap"],
        demonstrationId: TEST_DEMO_ID,
      },
    ]);
  });
});
