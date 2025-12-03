import { describe, it, expect, vi, beforeEach } from "vitest";
import { findNotStartedPhasesFromDates } from "./findNotStartedPhasesFromDates";
import { PrismaTransactionClient } from "../../../prismaClient";
import { SetApplicationDatesInput } from "../../applicationDate/applicationDateSchema";
import { TZDate } from "@date-fns/tz";

describe("findNotStartedPhasesFromDates", () => {
  let mockTx: PrismaTransactionClient;
  const applicationId = "test-app-id";
  const mockDate = new TZDate("2025-01-15T00:00:00-05:00");

  beforeEach(() => {
    mockTx = {
      applicationPhase: {
        findMany: vi.fn(),
      },
    } as unknown as PrismaTransactionClient;
  });

  it("should find Not Started phases matching the input date types", async () => {
    const input: SetApplicationDatesInput = {
      applicationId,
      applicationDates: [
        {
          dateType: "State Application Submitted Date",
          dateValue: mockDate,
        },
      ],
    };

    await findNotStartedPhasesFromDates(input, mockTx);

    expect(mockTx.applicationPhase.findMany).toHaveBeenCalledWith({
      select: {
        phaseId: true,
        phase: {
          select: {
            phase: {
              select: {
                phaseDateTypes: {
                  select: {
                    dateTypeId: true,
                  },
                },
              },
            },
          },
        },
      },
      where: {
        applicationId,
        phaseStatusId: "Not Started",
        phase: {
          phase: {
            phaseDateTypes: {
              some: {
                dateTypeId: {
                  in: ["State Application Submitted Date"],
                },
              },
            },
          },
        },
      },
      orderBy: {
        phase: {
          phase: {
            phaseNumber: "asc",
          },
        },
      },
    });
  });

  it("should query with multiple date types", async () => {
    const input: SetApplicationDatesInput = {
      applicationId,
      applicationDates: [
        {
          dateType: "State Application Submitted Date",
          dateValue: mockDate,
        },
        {
          dateType: "State Application Deemed Complete",
          dateValue: mockDate,
        },
        {
          dateType: "Expected Approval Date",
          dateValue: mockDate,
        },
      ],
    };

    vi.mocked(mockTx.applicationPhase.findMany).mockResolvedValue([]);

    await findNotStartedPhasesFromDates(input, mockTx);

    expect(mockTx.applicationPhase.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          phase: {
            phase: {
              phaseDateTypes: {
                some: {
                  dateTypeId: {
                    in: [
                      "State Application Submitted Date",
                      "State Application Deemed Complete",
                      "Expected Approval Date",
                    ],
                  },
                },
              },
            },
          },
        }),
      })
    );
  });
});
