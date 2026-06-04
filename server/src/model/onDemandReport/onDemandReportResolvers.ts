import { ZodError } from "zod";
import { runOnDemandReport } from "../../onDemandReports";
import { prisma } from "../../prismaClient";
import { OnDemandReportType } from "../../types";
import { GraphQLError } from "graphql/error";
import { CustomInternalErrorCode } from "../../errors/errorCodes";

export const onDemandReportResolvers = {
  Mutation: {
    generateOnDemandReport: async (parent: unknown, args: { reportType: OnDemandReportType }) => {
      try {
        const results = await runOnDemandReport(args.reportType, prisma());
        return JSON.stringify(results);
      } catch (error) {
        if (error instanceof ZodError) {
          throw new GraphQLError(
            `Running the on-demand ${args.reportType} report caused a Zod validation error.`,
            {
              extensions: {
                code: "ON_DEMAND_REPORT_ZOD_ERROR" satisfies CustomInternalErrorCode,
              },
            }
          );
        }
      }
    },
  },
};
