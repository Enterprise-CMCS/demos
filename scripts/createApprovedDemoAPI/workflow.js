import { randomUUID } from "node:crypto";
import {
  COMPLETED_PHASE_STATUS_ID,
  EXPECTED_FINAL_STATUS_ID,
  RANDOMIZED_HEALTH_FOCUS_TYPES,
  SEED_CONFIG,
} from "./config.js";
import {
  buildApplicationDates,
  buildDemonstrationWindow,
  selectApplicationDates,
} from "./dates.js";
import { readUploadPdf, uploadPhaseDocuments } from "./uploads.js";

function getConfiguredProjectOfficer() {
  const id = SEED_CONFIG.projectOfficerUserId.trim();
  if (!id || id === "TODO_PROJECT_OFFICER_USER_ID" || id === "MAKE AN .env") {
    throw new Error(
      "Set APPROVED_DEMO_PROJECT_OFFICER_USER_ID to an existing project officer id " +
        "before running this script."
    );
  }

  return { id };
}

function buildDemoName(stateName) {
  return `${stateName} ${SEED_CONFIG.demoNameSuffix} ${randomUUID().slice(0, 8)}`;
}

function pickRandomOrThrow(values, label) {
  if (!values.length) {
    throw new Error(`No values available to pick ${label}.`);
  }

  const index = Math.floor(Math.random() * values.length); // NOSONAR
  return values[index];
}

async function setApplicationDates(api, applicationId, applicationDates) {
  await api.setApplicationDates({
    applicationId,
    applicationDates,
  });
}

async function completePhase(api, applicationId, phaseName) {
  await api.completePhase({
    applicationId,
    phaseName,
  });
}

/**
 * Creates the approved demo
 *
 * @param step
 * @param api
 * @param approvalPackagePhaseDocuments
 */
export async function createApprovedDemo({
  step,
  api,
  approvalPackagePhaseDocuments,
}) {
  const projectOfficer = getConfiguredProjectOfficer();
  const stateOptions = await step("Loading project officer states", () =>
    api.getProjectOfficerStates(projectOfficer.id)
  );
  const state = pickRandomOrThrow(stateOptions, "state");
  const demonstrationType = pickRandomOrThrow(
    RANDOMIZED_HEALTH_FOCUS_TYPES,
    "demonstration type"
  );

  const pdfBytes = await step("Reading upload PDF", readUploadPdf);
  const demoWindow = buildDemonstrationWindow();
  const applicationDates = buildApplicationDates(demoWindow.effectiveDate);
  const demoName = buildDemoName(state.name);

  console.log(`Creating ${demoName}`);
  console.log(`Project officer id: ${projectOfficer.id}`);
  console.log(`Randomized state: ${state.name} (${state.id})`);
  console.log(`Randomized demonstration type: ${demonstrationType}`);

  const demonstration = await step("Creating demonstration", () =>
    api.createDemonstration({
      name: demoName,
      description: SEED_CONFIG.demoDescription,
      stateId: state.id,
      projectOfficerUserId: projectOfficer.id,
      sdgDivision: SEED_CONFIG.sdgDivisionId,
    })
  );

  await step("Updating demonstration dates", () =>
    api.updateDemonstration(demonstration.id, {
      effectiveDate: demoWindow.effectiveDate,
      expirationDate: demoWindow.expirationDate,
    })
  );

  await step("Applying demonstration type", () =>
    api.setDemonstrationTypes({
      demonstrationId: demonstration.id,
      demonstrationTypes: [
        {
          demonstrationTypeName: demonstrationType,
          demonstrationTypeDates: {
            effectiveDate: demoWindow.effectiveDate,
            expirationDate: demoWindow.expirationDate,
          },
        },
      ],
    })
  );

  await step("Completing Concept", async () => {
    await setApplicationDates(
      api,
      demonstration.id,
      selectApplicationDates(applicationDates, ["Concept Paper Submitted Date"])
    );
    await uploadPhaseDocuments({
      api,
      applicationId: demonstration.id,
      phaseName: "Concept",
      documentTypes: ["Pre-Submission"],
      pdfBytes,
    });
    await completePhase(api, demonstration.id, "Concept");
  });

  await step("Completing Application Intake", async () => {
    await setApplicationDates(
      api,
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "State Application Submitted Date",
        "Completeness Review Due Date",
      ])
    );
    await uploadPhaseDocuments({
      api,
      applicationId: demonstration.id,
      phaseName: "Application Intake",
      documentTypes: ["State Application"],
      pdfBytes,
    });
    await completePhase(api, demonstration.id, "Application Intake");
  });

  await step("Completing Completeness", async () => {
    await setApplicationDates(
      api,
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "State Application Deemed Complete",
        "Federal Comment Period Start Date",
        "Federal Comment Period End Date",
      ])
    );
    await uploadPhaseDocuments({
      api,
      applicationId: demonstration.id,
      phaseName: "Completeness",
      documentTypes: ["Application Completeness Letter", "Internal Completeness Review Form"],
      pdfBytes,
    });
    await completePhase(api, demonstration.id, "Completeness");
  });

  await step("Completing Federal Comment for this application", async () => {
    const federalComment = await api.completeFederalComment(demonstration.id);
    if (federalComment.phaseStatusId !== COMPLETED_PHASE_STATUS_ID) {
      throw new Error(
        `Federal Comment ended as ${federalComment.phaseStatusId}; ` +
          `expected ${COMPLETED_PHASE_STATUS_ID}.`
      );
    }
  });

  await step("Completing SDG Preparation", async () => {
    await setApplicationDates(
      api,
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "Expected Approval Date",
        "SME Initial Review Date",
        "FRT Initial Meeting Date",
        "BNPMT Initial Meeting Date",
      ])
    );
    await completePhase(api, demonstration.id, "SDG Preparation");
  });

  await step("Completing Review", async () => {
    await setApplicationDates(
      api,
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "OGD Approval to Share with SMEs",
        "Draft Approval Package to Prep",
        "DDME Approval Received",
        "State Concurrence",
        "BN PMT Approval to Send to OMB",
        "Draft Approval Package Shared",
        "Receive OMB Concurrence",
        "Receive OGC Legal Clearance",
        "Submit Approval Package to OSORA",
        "OSORA R1 Comments Due",
        "OSORA R2 Comments Due",
        "CMS (OSORA) Clearance End",
      ])
    );
    await completePhase(api, demonstration.id, "Review");
  });

  await step("Completing Approval Package", async () => {
    await uploadPhaseDocuments({
      api,
      applicationId: demonstration.id,
      phaseName: "Approval Package",
      documentTypes: approvalPackagePhaseDocuments,
      pdfBytes,
    });
    await completePhase(api, demonstration.id, "Approval Package");
  });

  await step("Completing Approval Summary", async () => {
    await setApplicationDates(
      api,
      demonstration.id,
      selectApplicationDates(applicationDates, [
        "Application Details Marked Complete Date",
        "Application Demonstration Types Marked Complete Date",
        "Application Approval Date",
      ])
    );
    await completePhase(api, demonstration.id, "Approval Summary");
  });

  const finalDemonstration = await step("Loading final demonstration", () =>
    api.getDemonstration(demonstration.id)
  );

  if (finalDemonstration.status !== EXPECTED_FINAL_STATUS_ID) {
    throw new Error(
      `Created demonstration ${finalDemonstration.id} but final status was ` +
        `${finalDemonstration.status}; expected ${EXPECTED_FINAL_STATUS_ID}.`
    );
  }

  console.log("");
  console.log("Approved demo created");
  console.log(`  id: ${finalDemonstration.id}`);
  console.log(`  name: ${finalDemonstration.name}`);
  console.log(`  state: ${finalDemonstration.state.name} (${finalDemonstration.state.id})`);
  console.log(`  status: ${finalDemonstration.status}`);
  console.log(`  currentPhase: ${finalDemonstration.currentPhaseName}`);
  console.log(`  sdgDivision: ${finalDemonstration.sdgDivision}`);
  console.log(
    `  demonstrationTypes: ${finalDemonstration.demonstrationTypes
      .map((assignment) => assignment.demonstrationTypeName)
      .join(", ")}`
  );
  console.log(`  uploadedDocuments: ${finalDemonstration.documents.length}`);
  console.log(`  url: /demonstrations/${finalDemonstration.id}`);
}
