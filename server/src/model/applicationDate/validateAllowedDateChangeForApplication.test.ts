import { describe, it, expect, vi, beforeEach } from "vitest";
import { SetApplicationDatesInput, LocalDate } from "../../types";
import { validateAllowedDateChangeForApplication } from "./validateAllowedDateChangeForApplication";

// Mock imports
import { getApplication, PrismaApplication } from "../application";

vi.mock("../application", () => ({
  getApplication: vi.fn(),
}));

describe("validateAllowedDateChangeForApplication", () => {
  const mockTransaction = {} as any;
  const testApplicationId = "0519b128-4fbb-4587-8793-3ee36b4a615b";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should not throw an error if the application is in an allowed status", async () => {
    const mockApplicationResult: Partial<PrismaApplication> = {
      id: "0519b128-4fbb-4587-8793-3ee36b4a615b",
      statusId: "Under Review",
    };
    const input: SetApplicationDatesInput = {
      applicationId: testApplicationId,
      applicationDates: [
        {
          dateType: "State Concurrence",
          dateValue: "2026-01-01" as LocalDate,
        },
      ],
    };

    vi.mocked(getApplication).mockResolvedValue(mockApplicationResult as PrismaApplication);

    await expect(
      validateAllowedDateChangeForApplication(mockTransaction, input)
    ).resolves.not.toThrow();

    expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId, {
      tx: mockTransaction,
    });
  });

  it("should throw an error if the application is not in an allowed status", async () => {
    const mockApplicationResult: Partial<PrismaApplication> = {
      id: "0519b128-4fbb-4587-8793-3ee36b4a615b",
      statusId: "Approved",
    };
    const input: SetApplicationDatesInput = {
      applicationId: testApplicationId,
      applicationDates: [
        {
          dateType: "State Concurrence",
          dateValue: "2026-01-01" as LocalDate,
        },
      ],
    };

    vi.mocked(getApplication).mockResolvedValue(mockApplicationResult as PrismaApplication);

    await expect(validateAllowedDateChangeForApplication(mockTransaction, input)).rejects.toThrow(
      `Cannot modify dates on application ${testApplicationId} because it has status ` +
        "Approved; applications must have one of these " +
        "statuses to be editable: Pre-Submission, Under Review, On-hold"
    );

    expect(getApplication).toHaveBeenCalledExactlyOnceWith(testApplicationId, {
      tx: mockTransaction,
    });
  });
});
