import { ZodError } from "zod";
import { runOnDemandReport } from "../../onDemandReports";
import { prisma } from "../../prismaClient";
import { OnDemandReportType } from "../../types";
import { throwCustomGQLError } from "../../errors/errorCodes";

export const onDemandReportResolvers = {
  Mutation: {
    generateOnDemandReport: async (parent: unknown, args: { reportType: OnDemandReportType }) => {
      try {
        await runOnDemandReport(args.reportType, prisma());
        return "The query for the report ran successfully!";
      } catch (error) {
        if (error instanceof ZodError) {
          throwCustomGQLError(
            `Running the on-demand ${args.reportType} report caused a Zod validation error.`,
            "ON_DEMAND_REPORT_ZOD_ERROR"
          );
        } else {
          throw error;
        }
      }
    },
  },
};
