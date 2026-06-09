import { ZodError } from "zod";
import { randomUUID } from "node:crypto";
import { runOnDemandReport } from "../../onDemandReports";
import { prisma } from "../../prismaClient";
import { OnDemandReportType } from "../../types";
import { throwCustomGQLError } from "../../errors/errorCodes";
import { getS3Adapter } from "../../adapters";
import { GraphQLContext } from "../../auth";
import { insertOnDemandReport } from "./queries";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { log } from "../../log";

export const onDemandReportResolvers = {
  Mutation: {
    generateOnDemandReport: async (
      parent: unknown,
      args: { reportType: OnDemandReportType },
      context: GraphQLContext
    ): Promise<string> => {
      let uploadedReportS3Path: string;
      const reportId = randomUUID();
      const s3Adapter = getS3Adapter();
      try {
        uploadedReportS3Path = await prisma().$transaction(async (tx) => {
          const reportResults = await runOnDemandReport(args.reportType, tx);
          const fileS3Path = await s3Adapter.uploadOnDemandReport(
            reportId,
            Buffer.from(JSON.stringify(reportResults))
          );
          await insertOnDemandReport(
            {
              id: reportId,
              s3Path: fileS3Path,
              requestingUserId: context.user.id,
              reportTypeId: args.reportType,
              statusId: "Available",
              reportGeneratedAt: new Date(),
            },
            tx
          );
          return fileS3Path;
        });
      } catch (error) {
        await s3Adapter.deleteOnDemandReport(reportId).catch((cleanupError) => {
          const cleanupErrorMessage =
            "s3Adapter.deleteOnDemandReport encountered an error while trying to " +
            `clean up after generating report with ID ${reportId} failed.`;
          log.error(cleanupErrorMessage);
          log.error(cleanupError);
        });
        if (error instanceof ZodError) {
          throwCustomGQLError(
            `Running the on-demand ${args.reportType} report caused a Zod validation error.`,
            "ON_DEMAND_REPORT_ZOD_ERROR"
          );
        } else {
          handlePrismaError(error);
        }
      }
      return await s3Adapter.getPresignedDownloadUrl(uploadedReportS3Path);
    },
  },
};
