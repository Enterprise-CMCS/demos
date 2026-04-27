// Vitest and other helpers
import { describe, it, expect } from "vitest";
import { DeepPartial } from "../../testUtilities";

// Types
import { SelectManyDeliverableActionsRowResult } from "./queries";
import { DeliverableActionType, DeliverableExtensionReasonCode, PersonType } from "../../types";

// Functions under test
import { formatFullUserName, formatDetailsMessage } from "./deliverableActionFormattingFunctions";

// Mock imports

describe("deliverableActionFormattingFunctions", () => {
  const testDeliverableId = "425b6c65-45a9-46a0-8dc6-8140fc5634bf";

  describe("formatFullUserName", () => {
    it("should return System Update if no user is present", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
      };

      const result = formatFullUserName(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe("System Update");
    });

    it("should use the user.personTypeId (these should never be different anyway)", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
        user: {
          personTypeId: "demos-admin" satisfies PersonType,
          person: {
            firstName: "Jane",
            lastName: "Smith",
            personTypeId: "demos-cms-user" satisfies PersonType,
          },
        },
      };

      const result = formatFullUserName(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe("Jane Smith (Admin User)");
    });

    it("should return a formatted admin user if present", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
        user: {
          personTypeId: "demos-admin" satisfies PersonType,
          person: {
            firstName: "Jane",
            lastName: "Smith",
            personTypeId: "demos-admin" satisfies PersonType,
          },
        },
      };

      const result = formatFullUserName(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe("Jane Smith (Admin User)");
    });

    it("should return a formatted CMS user if present", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
        user: {
          personTypeId: "demos-cms-user" satisfies PersonType,
          person: {
            firstName: "Billy",
            lastName: "Smith",
            personTypeId: "demos-cms-user" satisfies PersonType,
          },
        },
      };

      const result = formatFullUserName(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe("Billy Smith (CMS User)");
    });

    it("should return a formatted state user if present", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
        user: {
          personTypeId: "demos-state-user" satisfies PersonType,
          person: {
            firstName: "Jackson",
            lastName: "Smith",
            personTypeId: "demos-state-user" satisfies PersonType,
          },
        },
      };

      const result = formatFullUserName(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe("Jackson Smith (State User)");
    });
  });

  describe("formatDetailsMessage", () => {
    it("should return the proper message for marking a deliverable past due", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
        actionTypeId: "Marked as Past Due" satisfies DeliverableActionType,
      };

      const result = formatDetailsMessage(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe("The deliverable is past its due date");
    });

    it("should return the proper message for requesting an extension", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
        actionTypeId: "Requested Extension" satisfies DeliverableActionType,
        oldDueDate: new Date(2026, 10, 13, 4, 59, 59, 999),
        activeExtension: {
          originalDateRequested: new Date(2027, 0, 12, 4, 59, 59, 999),
          reasonCodeId: "COVID-19" satisfies DeliverableExtensionReasonCode,
        },
        note: "COVID-19 is causing major delays in processing of paperwork.",
      };

      const result = formatDetailsMessage(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe(
        "Current Due Date: 11/12/2026\n" +
          "New Due Date Requested: 01/11/2027\n" +
          "Reason: COVID-19\n" +
          "Reason Details: COVID-19 is causing major delays in processing of paperwork."
      );
    });

    it("should return the proper message for approving an extension", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
        actionTypeId: "Approved Extension Request" satisfies DeliverableActionType,
        newDueDate: new Date(2026, 10, 13, 4, 59, 59, 999),
      };

      const result = formatDetailsMessage(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe("Approved Due Date: 11/12/2026");
    });

    it("should return the proper message for denying an extension", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
        actionTypeId: "Denied Extension Request" satisfies DeliverableActionType,
        note: "Your request for an extension is denied on the grounds of technical merit",
      };

      const result = formatDetailsMessage(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe(
        "Denial Reason: Your request for an extension is denied on the grounds of technical merit"
      );
    });

    it("should return the proper message for requesting resubmission", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
        actionTypeId: "Requested Resubmission" satisfies DeliverableActionType,
        oldDueDate: new Date(2026, 10, 13, 4, 59, 59, 999),
        newDueDate: new Date(2027, 0, 12, 4, 59, 59, 999),
        note: "Please resubmit with form J-127 attached! Thanks.",
      };

      const result = formatDetailsMessage(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe(
        "Old Due Date: 11/12/2026\n" +
          "New Due Date: 01/11/2027\n" +
          "Reason Details: Please resubmit with form J-127 attached! Thanks."
      );
    });

    it("should return the proper message for a manual date change", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
        actionTypeId: "Manually Changed Due Date" satisfies DeliverableActionType,
        oldDueDate: new Date(2026, 10, 13, 4, 59, 59, 999),
        newDueDate: new Date(2027, 0, 12, 4, 59, 59, 999),
        note: "Changed per request of PO",
      };

      const result = formatDetailsMessage(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe(
        "Old Due Date: 11/12/2026\n" +
          "New Due Date: 01/11/2027\n" +
          "Reason Details: Changed per request of PO"
      );
    });

    it("should return nothing if none of the special cases are encountered", () => {
      const testInput: DeepPartial<SelectManyDeliverableActionsRowResult> = {
        deliverableId: testDeliverableId,
        actionTypeId: "Submitted Deliverable" satisfies DeliverableActionType,
      };

      const result = formatDetailsMessage(testInput as SelectManyDeliverableActionsRowResult);
      expect(result).toBe("");
    });
  });
});
