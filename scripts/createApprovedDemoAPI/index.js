/* global process, URL */

import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { getLocalDatabaseUrl } from "../localDatabaseGuard.js";

dotenv.config({ path: new URL("../../server/.env", import.meta.url), quiet: true });
dotenv.config({ quiet: true });

const { SEED_CONFIG } = await import("./config.js");

process.env.DATABASE_URL = getLocalDatabaseUrl(SEED_CONFIG.fallbackDatabaseUrl);

const serverPackageJsonUrl = new URL("../../server/package.json", import.meta.url);
const serverRequire = createRequire(serverPackageJsonUrl);
const { require: tsxRequire } = serverRequire("tsx/cjs/api");
const requireServerTs = (specifier) =>
  tsxRequire(
    fileURLToPath(new URL(`../../server/src/${specifier}`, import.meta.url)),
    import.meta.url
  );

const { APPROVAL_PACKAGE_PHASE_DOCUMENTS } = requireServerTs("constants.ts");
const { prisma } = requireServerTs("prismaClient.ts");
const { demonstrationResolvers } = requireServerTs(
  "model/demonstration/demonstrationResolvers.ts"
);
const { applicationDateResolvers } = requireServerTs(
  "model/applicationDate/applicationDateResolvers.ts"
);
const { applicationPhaseResolvers } = requireServerTs(
  "model/applicationPhase/applicationPhaseResolvers.ts"
);
const { demonstrationTypeTagAssignmentResolvers } = requireServerTs(
  "model/demonstrationTypeTagAssignment/demonstrationTypeTagAssignmentResolvers.ts"
);
const { documentPendingUploadResolvers } = requireServerTs(
  "model/documentPendingUpload/documentPendingUploadResolvers.ts"
);

const { createApprovedDemo } = await import("./workflow.js");
const db = prisma();

function toMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

async function step(label, action) {
  try {
    return await action();
  } catch (error) {
    throw new Error(`${label} failed: ${toMessage(error)}`, { cause: error });
  }
}

try {
  await createApprovedDemo({
    db,
    step,
    approvalPackagePhaseDocuments: APPROVAL_PACKAGE_PHASE_DOCUMENTS,
    demonstrationResolvers,
    applicationDateResolvers,
    applicationPhaseResolvers,
    demonstrationTypeTagAssignmentResolvers,
    documentPendingUploadResolvers,
  });
} finally {
  await db.$disconnect();
}
