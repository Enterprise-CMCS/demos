import { faker } from "@faker-js/faker";
import { TZDate } from "@date-fns/tz";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SDG_DIVISIONS,
  PERSON_TYPES,
  PHASE_DOCUMENT_TYPE_MAP,
  NOTE_TYPES,
  TAG_TYPES,
  AMENDMENT_SIGNATURE_LEVELS,
  EXTENSION_SIGNATURE_LEVELS,
  FAQ_REFERENCE_TAG,
} from "./constants.js";
import {
  CreateDemonstrationInput,
  CreateAmendmentInput,
  CreateExtensionInput,
  UpdateDemonstrationInput,
  UpdateAmendmentInput,
  UpdateExtensionInput,
  SetApplicationDatesInput,
  CreateDeliverableInput,
  PersonType,
  DateTimeOrLocalDate,
} from "./types.js";
import { prisma } from "./prismaClient.js";
import { DocumentType, PhaseName } from "./types.js";
import {
  __createDemonstration,
  __updateDemonstration,
} from "./model/demonstration/demonstrationResolvers.js";
import { __updateAmendment } from "./model/amendment/amendmentResolvers.js";
import { __createExtension, __updateExtension } from "./model/extension/extensionResolvers.js";
import { __setApplicationDates } from "./model/applicationDate/applicationDateResolvers.js";
import { GraphQLContext } from "./auth/auth.util.js";
import { getManyApplications } from "./model/application";
import {
  approveDeliverableExtension,
  completeDeliverable,
  createDeliverable,
  denyDeliverableExtension,
  requestDeliverableExtension,
  requestDeliverableResubmission,
  startDeliverableReview,
  submitDeliverable,
  updateDeliverable,
} from "./model/deliverable";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Deliverable, Deliverable as PrismaDeliverable } from "@prisma/client";
import { selectDeliverableExtension } from "./model/deliverableExtension/queries";
import { createAmendment } from "./model/amendment/index.js";

const DOCUMENTS_PER_APPLICATION = 15;
const UIPATH_SEED_DOCUMENT_ID = "00000000-0000-0000-0000-000000000000";
const SEEDER_DIR = path.dirname(fileURLToPath(import.meta.url));
const UIPATH_SEED_PDF_PATH = path.resolve(
  SEEDER_DIR,
  "../../.devcontainer/localstack/debug/test_uipath.pdf"
);
const NEW_TAG_COUNT = 20;
const TAG_ASSIGNMENT_MAX = 5;
const DELIVERABLE_SEED_COUNT = 8;
const APPLICATION_TAG_SUGGESTION_POOL_SIZE = 10;
const BYPASS_USER_ID = "00000000-1111-2222-3333-123abc123abc";
const extensionCount = 8;
const amendmentCount = 10;

function getRandomPhaseDocumentTypeCombination(): {
  phaseName: PhaseName;
  documentType: DocumentType;
} {
  const phaseNames = Object.keys(PHASE_DOCUMENT_TYPE_MAP) as PhaseName[];
  const randomPhase = faker.helpers.arrayElement(phaseNames);
  const validDocumentTypes = PHASE_DOCUMENT_TYPE_MAP[randomPhase];
  const randomDocumentType = faker.helpers.arrayElement(validDocumentTypes);
  return {
    phaseName: randomPhase,
    documentType: randomDocumentType,
  };
}

async function seedTagsAndStatuses() {
  console.log("🌱 Seeding tags and tag statuses...");
  // add some random tags for unapproved tags
  for (let i = 0; i < NEW_TAG_COUNT; i++) {
    const tagName = faker.lorem.words(2);
    await prisma().tagName.create({
      data: {
        id: tagName,
      },
    });
    await prisma().tag.create({
      data: {
        tagNameId: tagName,
        tagTypeId: faker.helpers.arrayElement(TAG_TYPES),
        sourceId: "User",
        statusId: "Unapproved",
      },
    });
  }

  // assign random tags to applications
  const applications = await prisma().application.findMany();
  for (const application of applications) {
    const applicationTags = await prisma().tag.findMany({
      where: {
        tagTypeId: "Application",
      },
    });

    const maxApplicationTags = Math.min(TAG_ASSIGNMENT_MAX, applicationTags.length);
    const tagsToAssign = sampleFromArray(
      applicationTags,
      Math.floor(Math.random() * (maxApplicationTags + 1)) // NOSONAR
    );

    for (const tag of tagsToAssign) {
      await prisma().applicationTagAssignment.create({
        data: {
          applicationId: application.id,
          tagNameId: tag.tagNameId,
          tagTypeId: tag.tagTypeId,
        },
      });
    }
  }

  const demonstrations = await prisma().demonstration.findMany();
  for (const demonstration of demonstrations) {
    const demonstrationTypes = await prisma().tag.findMany({
      where: {
        tagTypeId: "Demonstration Type",
      },
    });

    const maxDemonstrationTypes = Math.min(TAG_ASSIGNMENT_MAX, demonstrationTypes.length);
    const demonstrationTypesToAssign = sampleFromArray(
      demonstrationTypes,
      Math.floor(Math.random() * (maxDemonstrationTypes + 1)) // NOSONAR
    );

    for (const demonstrationType of demonstrationTypesToAssign) {
      await prisma().demonstrationTypeTagAssignment.create({
        data: {
          demonstrationId: demonstration.id,
          tagNameId: demonstrationType.tagNameId,
          tagTypeId: demonstrationType.tagTypeId,
          effectiveDate: faker.date.past(),
          expirationDate: faker.date.future(),
        },
      });
    }
  }
}

async function seedApprovedDemonstrations() {
  console.log("🌱 Seeding approved demonstrations...");
  const approvableDemonstrations = await prisma().demonstration.findMany({
    where: {
      demonstrationTypeTagAssignments: {
        some: {},
      },
    },
    select: {
      id: true,
      sdgDivisionId: true,
    },
  });
  if (!approvableDemonstrations.length) {
    throw new Error("No demonstrations with demonstration types found for approved-demo seeding");
  }

  const approvedDemonstrations = faker.helpers.arrayElements(
    approvableDemonstrations,
    faker.number.int({ min: 1, max: approvableDemonstrations.length })
  );

  for (const demonstration of approvedDemonstrations) {
    await prisma().$transaction([
      prisma().demonstration.update({
        where: { id: demonstration.id },
        data: {
          signatureLevelId: "OA",
          statusId: "Approved",
          sdgDivisionId: demonstration.sdgDivisionId ?? SDG_DIVISIONS[0],
        },
      }),
      prisma().applicationPhase.update({
        where: {
          applicationId_phaseId: {
            applicationId: demonstration.id,
            phaseId: "Approval Summary",
          },
        },
        data: {
          phaseStatusId: "Completed",
        },
      }),
    ]);
  }
}

async function seedDeliverables(actionUserId: string, actionUserPersonTypeId: PersonType) {
  console.log("🌱 Seeding deliverables...");
  const deliverableTypes = await prisma().deliverableType.findMany({
    select: { id: true },
  });
  const cmsOwners = await prisma().user.findMany({
    where: {
      personTypeId: {
        in: ["demos-admin", "demos-cms-user"],
      },
    },
    select: { id: true },
  });
  const approvedDemonstrations = await prisma().demonstration.findMany({
    where: { statusId: "Approved" },
    select: {
      id: true,
      demonstrationTypeTagAssignments: {
        select: {
          tagNameId: true,
        },
      },
    },
  });
  if (!deliverableTypes.length || !cmsOwners.length || !approvedDemonstrations.length) {
    throw new Error("Missing data required for deliverable seeding");
  }

  const context = {
    user: {
      id: actionUserId,
      personTypeId: actionUserPersonTypeId,
    },
  } as GraphQLContext;

  const createdDeliverables = [];

  for (let i = 0; i < DELIVERABLE_SEED_COUNT; i++) {
    const demonstration = faker.helpers.arrayElement(approvedDemonstrations);
    const deliverableTypeIds = deliverableTypes.map((d) => d.id);
    const selectedType = faker.helpers.arrayElement(deliverableTypeIds);
    const demonstrationTypeIds = demonstration.demonstrationTypeTagAssignments.map(
      (assignment) => assignment.tagNameId
    );
    const selectedDemonstrationTypes = sampleFromArray(
      demonstrationTypeIds,
      Math.min(2, demonstrationTypeIds.length)
    );

    const createInput: CreateDeliverableInput = {
      name: `${selectedType} ${i + 1}`,
      deliverableType: selectedType as CreateDeliverableInput["deliverableType"],
      demonstrationId: demonstration.id,
      cmsOwnerUserId: faker.helpers.arrayElement(cmsOwners).id,
      dueDate: faker.date
        .future({ years: 2 })
        .toISOString()
        .slice(0, 10) as CreateDeliverableInput["dueDate"],
      demonstrationTypes: selectedDemonstrationTypes,
    };
    createdDeliverables.push(await createDeliverable(createInput, context));
  }
  return createdDeliverables;
}

async function addDocumentsToDeliverable(deliverable: Deliverable) {
  const context = {
    user: {
      id: BYPASS_USER_ID,
      personTypeId: "demos-admin",
    },
  } as GraphQLContext;
  for (let i = 0; i < 5; i++) {
    await prisma().document.create({
      data: {
        name: "Test deliverable cms document",
        description: faker.lorem.sentence(5),
        s3Path: "tmp",
        ownerUserId: context.user.id,
        documentTypeId: "General File",
        applicationId: deliverable.demonstrationId,
        deliverableId: deliverable.id,
        deliverableTypeId: deliverable.deliverableTypeId,
        deliverableIsCmsAttachedFile: true,
        createdAt: new Date(),
      },
    });
  }

  for (let i = 0; i < 5; i++) {
    await prisma().document.create({
      data: {
        name: faker.lorem.sentence(2),
        description: faker.lorem.sentence(5),
        s3Path: "tmp",
        ownerUserId: context.user.id,
        documentTypeId: "General File",
        applicationId: deliverable.demonstrationId,
        deliverableId: deliverable.id,
        deliverableTypeId: deliverable.deliverableTypeId,
        deliverableIsCmsAttachedFile: false,
        createdAt: new Date(),
      },
    });
  }
}

async function simulateDeliverableActions(deliverable: PrismaDeliverable) {
  const context = {
    user: {
      id: BYPASS_USER_ID,
      personTypeId: "demos-admin",
    },
  } as GraphQLContext;
  await updateDeliverable(
    deliverable.id,
    { dueDate: { newDueDate: "2028-11-01" as DateTimeOrLocalDate, dateChangeNote: "Test change" } },
    context
  );
  await requestDeliverableExtension(
    deliverable.id,
    {
      reason: "COVID-19",
      details: "This is a thing",
      requestedDueDate: "2028-11-30" as DateTimeOrLocalDate,
    },
    context
  );
  // Need a document of the right type to submit
  await prisma().document.create({
    data: {
      name: "This is a test document to support test submission of a deliverable",
      description: faker.lorem.sentence(5),
      s3Path: "tmp",
      ownerUserId: context.user.id,
      documentTypeId: "General File",
      applicationId: deliverable.demonstrationId,
      deliverableId: deliverable.id,
      deliverableTypeId: deliverable.deliverableTypeId,
      deliverableIsCmsAttachedFile: false,
      createdAt: new Date(),
    },
  });
  await submitDeliverable(deliverable.id, context);
  await requestDeliverableResubmission(
    deliverable.id,
    {
      details: "This is a resubmission request",
      newDueDate: "2028-12-31" as DateTimeOrLocalDate,
    },
    context
  );
  const firstDeliverableExtension = await selectDeliverableExtension(
    {
      deliverableId: deliverable.id,
      statusId: "Requested",
    },
    true
  );
  await approveDeliverableExtension(
    deliverable.id,
    {
      deliverableExtensionId: firstDeliverableExtension.id,
    },
    context
  );
  await submitDeliverable(deliverable.id, context);
  await startDeliverableReview(deliverable.id, context);
  await requestDeliverableResubmission(
    deliverable.id,
    {
      details: "This is a secondary resubmission request",
      newDueDate: "2029-01-31" as DateTimeOrLocalDate,
    },
    context
  );
  await requestDeliverableExtension(
    deliverable.id,
    {
      reason: "Other",
      details: "Need more time for the resubmission request",
      requestedDueDate: "2029-02-15" as DateTimeOrLocalDate,
    },
    context
  );
  const secondDeliverableExtension = await selectDeliverableExtension(
    {
      deliverableId: deliverable.id,
      statusId: "Requested",
    },
    true
  );
  await submitDeliverable(deliverable.id, context);
  await startDeliverableReview(deliverable.id, context);
  await denyDeliverableExtension(
    deliverable.id,
    {
      deliverableExtensionId: secondDeliverableExtension.id,
      details: "Users have already submitted, no extension is required",
    },
    context
  );
  await completeDeliverable(deliverable.id, "Approved", context);
}

async function seedNotes() {
  console.log("🌱 Seeding application notes...");
  const applications = await prisma().application.findMany();
  for (const application of applications) {
    const noteContent = faker.lorem.paragraph();
    await prisma().applicationNote.create({
      data: {
        applicationId: application.id,
        noteTypeId: faker.helpers.arrayElement(NOTE_TYPES),
        content: noteContent,
      },
    });
  }
}

async function seedDocuments() {
  console.log("🌱 Seeding documents...");

  const s3Client = new S3Client(
    process.env.S3_ENDPOINT_LOCAL
      ? {
          region: "us-east-1",
          endpoint: process.env.S3_ENDPOINT_LOCAL,
          forcePathStyle: true,
          credentials: {
            accessKeyId: "test",
            secretAccessKey: "test", // pragma: allowlist secret
          },
        }
      : {}
  );

  const applications = await prisma().application.findMany();
  const users = await prisma().user.findMany({
    select: { id: true },
  });
  const owner = await prisma().user.findFirst({
    select: { id: true },
  });

  if (!owner) {
    throw new Error("Could not seed documents: no owner user found.");
  }
  if (!users.length) {
    throw new Error("Could not seed documents: no users found.");
  }

  for (const application of applications) {
    for (let i = 0; i < DOCUMENTS_PER_APPLICATION; i++) {
      try {
        const { phaseName, documentType } = getRandomPhaseDocumentTypeCombination();
        const name = faker.lorem.sentence(2);
        let document = await prisma().document.create({
          data: {
            name: name,
            description: faker.lorem.sentence(5),
            s3Path: "tmp",
            ownerUserId: faker.helpers.arrayElement(users).id,
            documentTypeId: documentType,
            applicationId: application.id,
            phaseId: phaseName,
            createdAt: randomBackdatedDate(),
          },
        });
        const s3Path = `${application.id}/${document.id}`;
        document = await prisma().document.update({
          where: { id: document.id },
          data: {
            s3Path,
          },
        });
        const mockFileContent = Buffer.from(`Test file: ${JSON.stringify(document)}`);
        await s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.CLEAN_BUCKET,
            Key: s3Path,
            Body: mockFileContent,
          })
        );
      } catch (error) {
        console.error(`Could not seed document. ${error}`);
      }
    }
  }

  const seededApplication = applications[0];
  if (!seededApplication) {
    throw new Error("Could not seed UiPath static document: no applications found.");
  }

  const seededDocumentType: DocumentType = "General File";
  const seededPhase: PhaseName = "Application Intake";
  const seededS3Path = `${seededApplication.id}/${UIPATH_SEED_DOCUMENT_ID}`;
  const seededPdf = await readFile(UIPATH_SEED_PDF_PATH);

  await prisma().document.upsert({
    where: { id: UIPATH_SEED_DOCUMENT_ID },
    update: {
      name: "UiPath Seed Document",
      description: "Static seeded document for UiPath queue testing.",
      s3Path: seededS3Path,
      ownerUserId: owner.id,
      documentTypeId: seededDocumentType,
      applicationId: seededApplication.id,
      phaseId: seededPhase,
    },
    create: {
      id: UIPATH_SEED_DOCUMENT_ID,
      name: "UiPath Seed Document",
      description: "Static seeded document for UiPath queue testing.",
      s3Path: seededS3Path,
      ownerUserId: owner.id,
      documentTypeId: seededDocumentType,
      applicationId: seededApplication.id,
      phaseId: seededPhase,
      createdAt: randomBackdatedDate(),
    },
  });

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.CLEAN_BUCKET,
      Key: seededS3Path,
      Body: seededPdf,
      ContentType: "application/pdf",
    })
  );

  console.log(
    `🌱 Seeded UiPath test document: ${UIPATH_SEED_DOCUMENT_ID} (${seededS3Path}) using ${UIPATH_SEED_PDF_PATH}`
  );
}

async function seedApplicationTagSuggestions() {
  console.log("🌱 Seeding application tag suggestions...");

  const suggestedTags = Array.from({ length: APPLICATION_TAG_SUGGESTION_POOL_SIZE }, () =>
    faker.lorem.words(2)
  );
  // for every document, make an extract

  const documents = await prisma().document.findMany();

  for (const document of documents) {
    if (!document.applicationId) continue;

    const uipathResultId = faker.string.uuid();
    await prisma().uiPathResult.create({
      data: {
        id: uipathResultId,
        requestId: faker.string.uuid(),
        response: {},
        projectId: faker.string.uuid(),
        documentId: document.id,
        applicationId: document.applicationId,
        statusId: "Finished",
      },
    });

    const uiPathValueId = faker.string.uuid();
    const value = faker.helpers.arrayElement(suggestedTags);
    await prisma().uiPathValue.create({
      data: {
        id: uiPathValueId,
        uiPathResultId: uipathResultId,
        documentId: document.id,
        applicationId: document.applicationId,
        fieldId: "demo_type",
        value: value,
        textLength: 1,
        textStartIndex: 1,
        confidence: 1,
        tokenList: {},
      },
    });
    await prisma().applicationTagSuggestionExtract.create({
      data: {
        uiPathValueId: uiPathValueId,
        applicationId: document.applicationId,
        fieldId: "demo_type",
        value: value,
        startPageNo: 1,
        endPageNo: 2,
      },
    });
  }
}

async function seedReferences() {
  console.log("🌱 Seeding reference records...");

  const referenceIds = [];
  for (let i = 0; i < 5; i++) {
    referenceIds.push(faker.string.uuid());
  }
  const faqReferenceId = referenceIds[2];
  const doubledReferenceId = referenceIds[3];
  const referenceNoAgreementId = referenceIds[4];
  const referenceAgreementIds = [faker.string.uuid(), faker.string.uuid(), faker.string.uuid()];

  const s3Client = new S3Client(
    process.env.S3_ENDPOINT_LOCAL
      ? {
          region: "us-east-1",
          endpoint: process.env.S3_ENDPOINT_LOCAL,
          forcePathStyle: true,
          credentials: {
            accessKeyId: "test",
            secretAccessKey: "test", // pragma: allowlist secret
          },
        }
      : {}
  );

  for (const referenceAgreementId of referenceAgreementIds) {
    await prisma().referenceAgreement.create({
      data: {
        id: referenceAgreementId,
        name: faker.lorem.words(3),
        s3Path: `references/agreements/${referenceAgreementId}`,
        ownerUserId: BYPASS_USER_ID,
        ownerPersonTypeId: "demos-admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLEAN_BUCKET,
        Key: `references/agreements/${referenceAgreementId}`,
        Body: Buffer.from(`Test reference agreement: ${referenceAgreementId}`),
      })
    );
  }
  for (const referenceId of referenceIds) {
    await prisma().reference.create({
      data: {
        id: referenceId,
        name: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        s3Path: `references/${referenceId}`,
        ownerUserId: BYPASS_USER_ID,
        ownerPersonTypeId: "demos-admin",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.CLEAN_BUCKET,
        Key: `references/${referenceId}`,
        Body: Buffer.from(`Test reference: ${referenceId}`),
      })
    );

    if (referenceId === faqReferenceId) {
      await prisma().referenceTagAssignment.create({
        data: {
          referenceId: referenceId,
          tagNameId: FAQ_REFERENCE_TAG,
          tagTypeId: "Reference",
        },
      });
      await prisma().referenceConfiguration.create({
        data: {
          id: faker.string.uuid(),
          referenceId: referenceId,
          referenceAgreementId: null,
          statusId: "Active",
        },
      });
    } else if (referenceId === doubledReferenceId) {
      await prisma().referenceConfiguration.create({
        data: {
          id: faker.string.uuid(),
          referenceId: referenceId,
          referenceAgreementId: referenceAgreementIds[0],
          statusId: "Inactive",
        },
      });
      await prisma().referenceConfiguration.create({
        data: {
          id: faker.string.uuid(),
          referenceId: referenceId,
          referenceAgreementId: referenceAgreementIds[1],
          statusId: "Active",
        },
      });
    } else if (referenceId === referenceNoAgreementId) {
      await prisma().referenceConfiguration.create({
        data: {
          id: faker.string.uuid(),
          referenceId: referenceId,
          referenceAgreementId: null,
          statusId: "Active",
        },
      });
    } else {
      await prisma().referenceConfiguration.create({
        data: {
          id: faker.string.uuid(),
          referenceId: referenceId,
          referenceAgreementId: referenceAgreementIds[0],
          statusId: "Active",
        },
      });
    }

    if (referenceId !== faqReferenceId) {
      const demonstrationTypes = sampleFromArray(
        [
          "Dental",
          "Designated State Health Programs (DSHP)",
          "Employment Supports",
          "End-Stage Renal Disease (ESRD)",
          "Enrollment Cap",
        ],
        sampleFromArray([1, 2, 3], 1)[0]
      );
      for (const demonstrationType of demonstrationTypes) {
        await prisma().referenceDemonstrationType.create({
          data: {
            referenceId: referenceId,
            demonstrationTypeTagNameId: demonstrationType,
            demonstrationTypeTagTypeId: "Demonstration Type",
          },
        });
      }
    }
  }
}

function randomDateRange() {
  const randomStart = faker.date.future({ years: 1 });
  const randomEnd = faker.date.future({ years: 1, refDate: randomStart });

  const randomEasternStart = new TZDate(randomStart, "America/New_York");
  const randomEasternEnd = new TZDate(randomEnd, "America/New_York");

  randomEasternStart.setHours(0, 0, 0, 0);
  randomEasternEnd.setHours(23, 59, 59, 999);

  return { start: randomEasternStart, end: randomEasternEnd };
}

function randomBackdatedDate() {
  // choose a random date within the last year
  return faker.date.recent({ days: 365 });
}

function checkIfAllowed() {
  if (process.env.ALLOW_SEED !== "true") {
    throw new Error("Database seeding is not allowed. Set ALLOW_SEED=true to use this feature.");
  }
}

function shuffleArray<T>(arrayToShuffle: T[]): T[] {
  const shuffledArray = Array.from(arrayToShuffle);
  for (let oldIndex = shuffledArray.length - 1; oldIndex > 0; oldIndex--) {
    const newIndex = Math.floor(Math.random() * (oldIndex + 1));
    const oldValue = shuffledArray[oldIndex];
    const newValue = shuffledArray[newIndex];
    shuffledArray[oldIndex] = newValue;
    shuffledArray[newIndex] = oldValue;
  }
  return shuffledArray;
}

function sampleFromArray<T>(arrayToSample: T[], recordsToSample: number): T[] {
  const shuffledArray = shuffleArray(arrayToSample);
  return shuffledArray.slice(0, recordsToSample);
}

async function clearDatabase() {
  // Note: the history tables are not truncated in this process
  // Almost always, this runs via npm run seed which empties the DB anyway
  // However, if this does not happen, the history tables will contain the truncates
  return await prisma().$transaction([
    // Truncates must be done in proper order for relational reasons
    // Reference section
    prisma().referenceAgreementAcceptance.deleteMany(),
    prisma().referenceDemonstrationType.deleteMany(),
    prisma().referenceTagAssignment.deleteMany(),
    prisma().referenceConfiguration.deleteMany(),
    prisma().referenceAgreement.deleteMany(),
    prisma().reference.deleteMany(),

    prisma().primaryDemonstrationRoleAssignment.deleteMany(),
    prisma().demonstrationRoleAssignment.deleteMany(),
    prisma().applicationDate.deleteMany(),
    prisma().applicationPhase.deleteMany(),
    prisma().applicationNote.deleteMany(),
    prisma().applicationTagAssignment.deleteMany(),
    prisma().$executeRawUnsafe(
      "TRUNCATE TABLE demos_app.demonstration_type_tag_assignment CASCADE;"
    ),
    prisma().applicationTagSuggestion.deleteMany(),
    prisma().applicationTagSuggestionExtract.deleteMany(),
    prisma().uiPathValue.deleteMany(),
    prisma().uiPathResult.deleteMany(),
    prisma().document.deleteMany(),
    prisma().deliverableAction.deleteMany(),
    prisma().deliverableExtension.deleteMany(),
    prisma().deliverable.deleteMany(),

    // Note that we must delete from application first
    // The foreign keys to that table from amendment/extension/demonstration are deferred
    // Those tables have triggers that prevent deletion if the corresponding record exists in application
    prisma().application.deleteMany(),
    prisma().amendment.deleteMany(),
    prisma().extension.deleteMany(),
    prisma().demonstration.deleteMany(),

    prisma().systemRoleAssignment.deleteMany(),
    prisma().personState.deleteMany(),
    prisma().userSession.deleteMany(),
    prisma().user.deleteMany(),
    prisma().person.deleteMany(),
  ]);
}

async function seedAmendments() {
  console.log("🌱 Seeding amendments...");

  const approvedDemonstrations = await prisma().demonstration.findMany({
    where: { statusId: "Approved" },
  });

  for (let i = 0; i < amendmentCount; i++) {
    try {
      const createInput: CreateAmendmentInput = {
        demonstrationId: faker.helpers.arrayElement(approvedDemonstrations).id,
        name: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        signatureLevel: sampleFromArray([...AMENDMENT_SIGNATURE_LEVELS, undefined], 1)[0],
      };
      await createAmendment(undefined, { input: createInput });
    } catch (error) {
      console.error(`Error creating amendment: ${error}`);
    }
  }
  const amendments = await getManyApplications("Amendment");
  for (const amendment of amendments!) {
    const randomDates = randomDateRange();
    const updatePayload: UpdateAmendmentInput = {
      effectiveDate: randomDates["start"],
    };
    const updateInput = {
      id: amendment.id,
      input: updatePayload,
    };
    await __updateAmendment(undefined, updateInput);
  }
}

async function seedExtensions() {
  console.log("🌱 Seeding extensions...");

  const approvedDemonstrations = await prisma().demonstration.findMany({
    where: { statusId: "Approved" },
  });

  for (let i = 0; i < extensionCount; i++) {
    const createInput: CreateExtensionInput = {
      demonstrationId: faker.helpers.arrayElement(approvedDemonstrations).id,
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      signatureLevel: sampleFromArray([...EXTENSION_SIGNATURE_LEVELS, undefined], 1)[0],
    };
    await __createExtension(undefined, { input: createInput });
  }
  const extensions = await getManyApplications("Extension");
  for (const extension of extensions!) {
    const randomDates = randomDateRange();
    const updatePayload: UpdateExtensionInput = {
      effectiveDate: randomDates["start"],
    };
    const updateInput = {
      id: extension.id,
      input: updatePayload,
    };
    await __updateExtension(undefined, updateInput);
  }
}

async function seedDatabase() {
  console.log(process.env.ALLOW_SEED);
  checkIfAllowed();

  await clearDatabase();

  // Setting constants for record generation
  const userCount = 9;
  const demonstrationCount = 20;

  console.log("🌱 Generating bypassed user and accompanying records...");
  const bypassUserId = BYPASS_USER_ID;
  const bypassUserSub = "1234abcd-0000-1111-2222-333333333333";

  await prisma().person.create({
    data: {
      id: bypassUserId,
      personTypeId: "demos-admin",
      email: "bypassedUser@email.com",
      firstName: "Bypassed",
      lastName: "User",
    },
  });
  await prisma().user.create({
    data: {
      id: bypassUserId,
      personTypeId: "demos-admin",
      cognitoSubject: bypassUserSub,
      username: "BYPASSED_USER",
    },
  });

  console.log("🌱 Seeding people and users...");
  for (let i = 0; i < userCount; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const person = await prisma().person.create({
      data: {
        personType: {
          connect: { id: PERSON_TYPES[i % (PERSON_TYPES.length - 1)] },
        },
        email: faker.internet.email(),
        firstName: firstName,
        lastName: lastName,
      },
    });
    await prisma().user.create({
      data: {
        id: person.id,
        personTypeId: person.personTypeId,
        cognitoSubject: faker.string.uuid(),
        username: faker.internet.username(),
      },
    });
  }

  console.log("🌱 Seeding person states...");
  const allPeople = await prisma().person.findMany();
  const states = await prisma().state.findMany();
  if (!states.length) {
    throw new Error("No states found to assign to person");
  }
  for (const person of allPeople) {
    // demos-cms-users already belong to every state, so this applies only to state users
    if (person.personTypeId !== "demos-state-user") continue;

    // for now, just adding one state to each person
    const state = faker.helpers.arrayElement(states);
    await prisma().personState.create({
      data: {
        personId: person.id,
        stateId: state.id,
      },
    });
  }

  console.log("🌱 Seeding system role assignments...");
  const people = await prisma().person.findMany();
  for (const person of people) {
    const applicableRoles = await prisma().role.findMany({
      where: {
        grantLevelId: "System",
        rolePersonTypes: {
          some: {
            personTypeId: person.personTypeId,
          },
        },
      },
    });

    const role = faker.helpers.arrayElement(applicableRoles);
    await prisma().systemRoleAssignment.create({
      data: {
        personId: person.id,
        personTypeId: person.personTypeId,
        roleId: role.id,
        grantLevelId: "System",
      },
    });
  }
  // need to add a project officer to each demonstration, so creating a new user from a matching state
  console.log("🌱 Seeding demonstrations...");
  const healthFocusTitles = [
    "Beneficiary Engagement",
    "PHE-COVID-19",
    "Aggregate Cap",
    "Annual Limits",
    "Basic Health Plan (BHP)",
    "Behavioral Health",
    "Children's Health Insurance Program (CHIP)",
    "CMMI - AHEAD",
    "CMMI - Integrated Care for Kids (IncK)",
    "CMMI - Maternal Opioid Misuse (MOM)",
    "Community Engagement",
    "Contingency Management",
    "Continuous Eligibility",
    "Delivery System Reform Incentive Payment (DSRIP)",
    "Dental",
    "Designated State Health Programs (DSHP)",
    "Employment Supports",
    "Enrollment Cap",
    "End-Stage Renal Disease (ESRD)",
    "Expenditure Cap",
    "Former Foster Care Youth (FFCY)",
    "Global Payment Program (GPP)",
    "Health Equity",
    "Health-Related Social Needs (HRSN)",
    "Healthy Behavior Incentives",
    "HIV",
    "Home Community Based Services (HCBS)",
    "Lead Exposure",
    "Lifetime Limits",
    "Long-Term Services and Supports (LTSS)",
    "Managed Care",
    "Marketplace Coverage/Premium Assistance Wrap",
    "New Adult Group Expansion",
    "Non-Eligibility Period",
    "Non-Emergency Medical Transportation (NEMT)",
    "Partial Expansion of the New Adult Group",
    "Pharmacy",
    "PHE-Appendix K",
    "PHE-Reasonable Opportunity Period (ROP)",
    "PHE-Risk Mitigation",
    "PHE-Vaccine Coverage",
    "Premiums/Cost-Sharing",
    "Provider Cap",
    "Provider Restriction",
    "ReEntry",
    "Reproductive Health: Family Planning",
    "Reproductive Health: Fertility",
    "Reproductive Health: Hyde",
    "Reproductive Health: Maternal Health",
    "Reproductive Health: Post-Partum Extension",
    "Reproductive Health: RAD",
    "Retroactive Eligibility",
    "Serious Mental Illness (SMI)",
    "Special Needs",
    "Substance Use Disorder (SUD)",
    "Targeted Population Expansion",
    "Tribal",
    "Uncompensated Care",
    "Value Based Care (VBC)",
    "Vision",
  ];
  const demonstrationTypes = ["Section 1115", "Section 1915(b)", "Section 1915(c)"];
  const cmsUsers = await prisma().person.findMany({
    where: { personTypeId: "demos-cms-user" },
    include: {
      personStates: {
        include: { state: true },
      },
    },
  });
  if (!cmsUsers.length) {
    throw new Error("No cms users found to assign as project officers");
  }

  for (let i = 0; i < demonstrationCount; i++) {
    // get a random cms-user
    const person = faker.helpers.arrayElement(cmsUsers);

    let stateSelection = sampleFromArray(person.personStates, 1)[0];
    if (!stateSelection) {
      const fallbackState = faker.helpers.arrayElement(states);
      if (!fallbackState) {
        throw new Error("No states available to assign to demonstration");
      }
      stateSelection = { stateId: fallbackState.id, state: fallbackState, personId: person.id };
    }

    const stateName = stateSelection.state?.name ?? stateSelection.stateId;
    const waiverType = sampleFromArray(demonstrationTypes, 1)[0];
    const focusArea = sampleFromArray(healthFocusTitles, 1)[0];
    const demoName = `${stateName} ${waiverType} Waiver: ${focusArea}`;

    const createInput: CreateDemonstrationInput = {
      name: demoName,
      description: faker.lorem.sentence(),
      sdgDivision: sampleFromArray([...SDG_DIVISIONS, undefined], 1)[0],
      stateId: stateSelection.stateId,
      projectOfficerUserId: person.id,
    };
    await __createDemonstration(undefined, { input: createInput });
  }
  const demonstrations = (await getManyApplications("Demonstration"))!;

  for (const demonstration of demonstrations) {
    const randomDates = randomDateRange();
    const updatePayload: UpdateDemonstrationInput = {
      effectiveDate: randomDates["start"],
      expirationDate: randomDates["end"],
    };

    const updateInput = {
      id: demonstration.id,
      input: updatePayload,
    };

    await __updateDemonstration(undefined, updateInput);
  }

  console.log("🌱 Seeding all dates for one demonstration");
  const randomDemonstration = faker.helpers.arrayElement(
    await prisma().demonstration.findMany({
      select: {
        id: true,
      },
    })
  );
  const dateInput: SetApplicationDatesInput = {
    applicationId: randomDemonstration!.id,
    applicationDates: [
      {
        dateType: "Concept Start Date",
        dateValue: new Date("2025-01-01T00:00:00.000-05:00"),
      },
      {
        dateType: "Concept Paper Submitted Date",
        dateValue: new Date("2025-01-13T00:00:00.000-05:00"),
      },
      {
        dateType: "Concept Completion Date",
        dateValue: new Date("2025-01-16T00:00:00.000-05:00"),
      },
      {
        dateType: "Application Intake Start Date",
        dateValue: new Date("2025-01-16T00:00:00.000-05:00"),
      },
      {
        dateType: "State Application Submitted Date",
        dateValue: new Date("2025-01-23T00:00:00.000-05:00"),
      },
      {
        dateType: "Completeness Review Due Date",
        dateValue: new Date("2025-02-07T23:59:59.999-05:00"),
      },
      {
        dateType: "Application Intake Completion Date",
        dateValue: new Date("2025-01-24T00:00:00.000-05:00"),
      },
      {
        dateType: "Completeness Start Date",
        dateValue: new Date("2025-01-24T00:00:00.000-05:00"),
      },
      {
        dateType: "State Application Deemed Complete",
        dateValue: new Date("2025-02-03T00:00:00.000-05:00"),
      },
      {
        dateType: "Federal Comment Period Start Date",
        dateValue: new Date("2025-02-04T00:00:00.000-05:00"),
      },
      {
        dateType: "Federal Comment Period End Date",
        dateValue: new Date("2025-03-06T23:59:59.999-05:00"),
      },
      {
        dateType: "Completeness Completion Date",
        dateValue: new Date("2025-02-04T00:00:00.000-05:00"),
      },
      {
        dateType: "SDG Preparation Start Date",
        dateValue: new Date("2025-02-04T00:00:00.000-05:00"),
      },
      {
        dateType: "Expected Approval Date",
        dateValue: new Date("2025-02-05T00:00:00.000-05:00"),
      },
      {
        dateType: "SME Initial Review Date",
        dateValue: new Date("2025-02-06T00:00:00.000-05:00"),
      },
      {
        dateType: "FRT Initial Meeting Date",
        dateValue: new Date("2025-02-07T00:00:00.000-05:00"),
      },
      {
        dateType: "BNPMT Initial Meeting Date",
        dateValue: new Date("2025-02-08T00:00:00.000-05:00"),
      },
      {
        dateType: "SDG Preparation Completion Date",
        dateValue: new Date("2025-02-09T00:00:00.000-05:00"),
      },
      {
        dateType: "Review Start Date",
        dateValue: new Date("2025-02-09T00:00:00.000-05:00"),
      },
      {
        dateType: "Review Completion Date",
        dateValue: new Date("2025-02-13T00:00:00.000-05:00"),
      },
      {
        dateType: "OGD Approval to Share with SMEs",
        dateValue: new Date("2025-02-14T00:00:00.000-05:00"),
      },
      {
        dateType: "Draft Approval Package to Prep",
        dateValue: new Date("2025-02-15T00:00:00.000-05:00"),
      },
      {
        dateType: "DDME Approval Received",
        dateValue: new Date("2025-02-16T00:00:00.000-05:00"),
      },
      {
        dateType: "State Concurrence",
        dateValue: new Date("2025-02-17T00:00:00.000-05:00"),
      },
      {
        dateType: "BN PMT Approval to Send to OMB",
        dateValue: new Date("2025-02-18T00:00:00.000-05:00"),
      },
      {
        dateType: "Draft Approval Package Shared",
        dateValue: new Date("2025-02-19T00:00:00.000-05:00"),
      },
      {
        dateType: "Receive OMB Concurrence",
        dateValue: new Date("2025-02-20T00:00:00.000-05:00"),
      },
      {
        dateType: "Receive OGC Legal Clearance",
        dateValue: new Date("2025-02-21T00:00:00.000-05:00"),
      },
      {
        dateType: "Package Sent for COMMs Clearance",
        dateValue: new Date("2025-02-21T00:00:00.000-05:00"),
      },
      {
        dateType: "COMMs Clearance Received",
        dateValue: new Date("2025-02-21T00:00:00.000-05:00"),
      },
      {
        dateType: "Submit Approval Package to OSORA",
        dateValue: new Date("2025-02-21T00:00:00.000-05:00"),
      },
      {
        dateType: "OSORA R1 Comments Due",
        dateValue: new Date("2025-02-07T23:59:59.999-05:00"),
      },
      {
        dateType: "OSORA R2 Comments Due",
        dateValue: new Date("2025-02-07T23:59:59.999-05:00"),
      },
      {
        dateType: "CMS (OSORA) Clearance End",
        dateValue: new Date("2025-02-07T23:59:59.999-05:00"),
      },
    ],
  };
  await __setApplicationDates(undefined, { input: dateInput });

  // Having the SDG Preparation Start Date without the phase being started
  // causes errors handling the Federal Comment status; this fixes that
  await prisma().applicationPhase.update({
    where: {
      applicationId_phaseId: {
        applicationId: randomDemonstration!.id,
        phaseId: "SDG Preparation",
      },
    },
    data: {
      phaseStatusId: "Started",
    },
  });

  await seedTagsAndStatuses();
  await seedApprovedDemonstrations();
  await seedAmendments();
  await seedExtensions();
  const createdDeliverables = await seedDeliverables(bypassUserId, "demos-admin");
  await simulateDeliverableActions(createdDeliverables[0]);
  await addDocumentsToDeliverable(createdDeliverables[1]);

  await seedDocuments();

  await seedApplicationTagSuggestions();

  await seedNotes();

  await seedReferences();

  console.log("✨ Database seeding complete.");
}

seedDatabase().catch((error) => {
  console.error("❌ An error occurred while seeding the database:", error);
});
