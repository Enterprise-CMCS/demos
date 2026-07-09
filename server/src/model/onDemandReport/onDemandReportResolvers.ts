import { prettifyError, ZodError } from "zod";
import { randomUUID } from "node:crypto";
import { formatOnDemandReportInExcel, runOnDemandReport } from "../../onDemandReports";
import { prisma } from "../../prismaClient";
import { OnDemandReportType } from "../../types";
import { throwCustomGQLError } from "../../errors/errorCodes";
import { getS3Adapter } from "../../adapters";
import { GraphQLContext } from "../../auth";
import { insertOnDemandReport } from "./queries";
import { handlePrismaError } from "../../errors/handlePrismaError";
import { log } from "../../log";
import { getEasternNow } from "../../dateUtilities";
import { generateOnDemandReportFileName } from "./generateOnDemandReportFileName";

export const onDemandReportResolvers = {
  Mutation: {
    generateOnDemandReport: async (
      parent: unknown,
      args: { reportType: OnDemandReportType },
      context: GraphQLContext
    ): Promise<string> => {
      let uploadedReportPaths: [string, string];
      const reportId = randomUUID();
      const s3Adapter = getS3Adapter();
      try {
        uploadedReportPaths = await prisma().$transaction(async (tx) => {
          const reportResults = await runOnDemandReport(args.reportType, tx);
          const generatedDate = getEasternNow();
          const formattedReport = await formatOnDemandReportInExcel(
            args.reportType,
            reportResults,
            { requestId: reportId, requestTimestamp: generatedDate["Current Time"] }
          );
          const fileS3Path = await s3Adapter.uploadOnDemandReport(reportId, formattedReport);
          const generatedFileName = generateOnDemandReportFileName(args.reportType, generatedDate);
          await insertOnDemandReport(
            {
              id: reportId,
              s3Path: fileS3Path,
              generatedFileName: generatedFileName,
              requestingUserId: context.user.id,
              reportTypeId: args.reportType,
              statusId: "Available",
              reportGeneratedAt: generatedDate["Current Time"].easternTZDate,
            },
            tx
          );
          return [fileS3Path, generatedFileName];
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
          log.error("Zod Validation Errors!\n" + prettifyError(error));
          throwCustomGQLError(
            `Running the on-demand ${args.reportType} report caused a Zod validation error.`,
            "ON_DEMAND_REPORT_ZOD_ERROR"
          );
        } else {
          handlePrismaError(error);
        }
      }
      // Name without extension — `.xlsx` is derived from the object's Content-Type.
      return await s3Adapter.getPresignedDownloadUrl(
        uploadedReportPaths[0],
        uploadedReportPaths[1],
        {
          disposition: "attachment",
        }
      );
    },
  },
};
