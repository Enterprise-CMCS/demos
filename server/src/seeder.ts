import { faker } from "@faker-js/faker";
import { TZDate } from "@date-fns/tz";
import {
  SDG_DIVISIONS,
  PERSON_TYPES,
  SIGNATURE_LEVEL,
  PHASE_DOCUMENT_TYPE_MAP,
} from "./constants.js";
import {
  CreateDemonstrationInput,
  CreateAmendmentInput,
  CreateExtensionInput,
  UpdateDemonstrationInput,
  UpdateAmendmentInput,
  UpdateExtensionInput,
  SetApplicationDatesInput,
  EventType,
  LogEventInput,
  Role,
} from "./types.js";
import { prisma } from "./prismaClient.js";
import { DocumentType, PhaseName, PhaseStatus } from "./types.js";
import {
  __createDemonstration,
  __updateDemonstration,
} from "./model/demonstration/demonstrationResolvers.js";
import { __createAmendment, __updateAmendment } from "./model/amendment/amendmentResolvers.js";
import { __createExtension, __updateExtension } from "./model/extension/extensionResolvers.js";
import { __setApplicationDates } from "./model/applicationDate/applicationDateResolvers.js";
import { logEvent } from "./model/event/eventResolvers.js";
import { GraphQLContext } from "./auth/auth.util.js";
import { getManyApplications } from "./model/application/applicationResolvers.js";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const DOCUMENTS_PER_APPLICATION = 15;

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
            ownerUserId: (await prisma().user.findRandom())!.id,
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
        // temporary bypass for backward compatability with simple upload.
        // TODO: remove this bypass
        if (process.env.LOCAL_SIMPLE_UPLOAD === "true") {
          continue;
        }
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
    prisma().primaryDemonstrationRoleAssignment.deleteMany(),
    prisma().demonstrationRoleAssignment.deleteMany(),
    prisma().applicationDate.deleteMany(),
    prisma().applicationPhase.deleteMany(),
    prisma().document.deleteMany(),

    // Note that we must delete from application first
    // The foreign keys to that table from amendment/extension/demonstration are deferred
    // Those tables have triggers that prevent deletion if the corresponding record exists in application
    prisma().application.deleteMany(),
    prisma().amendment.deleteMany(),
    prisma().extension.deleteMany(),
    prisma().demonstration.deleteMany(),

    prisma().event.deleteMany(),
    prisma().systemRoleAssignment.deleteMany(),
    prisma().personState.deleteMany(),
    prisma().user.deleteMany(),
    prisma().person.deleteMany(),
  ]);
}

async function seedDatabase() {
  console.log(process.env.ALLOW_SEED);
  checkIfAllowed();

  await clearDatabase();

  // Setting constants for record generation
  const userCount = 9;
  const demonstrationCount = 20;
  const amendmentCount = 10;
  const extensionCount = 8;

  console.log("🌱 Generating bypassed user and accompanying records...");
  const bypassUserId = "00000000-1111-2222-3333-123abc123abc";
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
  for (const person of allPeople) {
    // demos-cms-users already belong to every state, so this applies only to state users
    if (person.personTypeId !== "demos-state-user") continue;

    // for now, just adding one state to each person
    const state = await prisma().state.findRandom();
    if (!state) {
      throw new Error("No states found to assign to person");
    }
    await prisma().personState.create({
      data: {
        personId: person.id,
        stateId: state.id,
      },
    });
  }

  console.log("🌱 Seeding system role assignments...");
  // for each user, assign a random set of roles from the system roles
  const systemRoles = await prisma().role.findMany({
    where: { grantLevelId: "System" },
  });

  const people = await prisma().person.findMany();
  for (const person of people) {
    // NOSONAR - this is an appropriate use of Math.random() for seeding a random number of roles
    const roles = sampleFromArray(systemRoles, 1 + Math.floor(Math.random() * systemRoles.length)); // NOSONAR
    for (const role of roles) {
      await prisma().systemRoleAssignment.create({
        data: {
          personId: person.id,
          personTypeId: person.personTypeId,
          roleId: role.id,
          grantLevelId: "System",
        },
      });
    }
  }
  // need to add a project officer to each demonstration, so creating a new user from a matching state
  console.log("🌱 Seeding demonstrations...");
  const healthFocusTitles = [
    "Beneficiary Engagement",
    "PHE-COVID-19", "Aggregate Cap", "Annual Limits",
    "Basic Health Plan (BHP)", "Behavioral Health",
    "Children's Health Insurance Program (CHIP)",
    "CMMI - AHEAD", "CMMI - Integrated Care for Kids (IncK)",
    "CMMI - Maternal Opioid Misuse (MOM)",
    "Community Engagement", "Contingency Management",
    "Continuous Eligibility",
    "Delivery System Reform Incentive Payment (DSRIP)",
    "Dental", "Designated State Health Programs (DSHP)",
    "Employment Supports", "Enrollment Cap",
    "End-Stage Renal Disease (ESRD)", "Expenditure Cap",
    "Former Foster Care Youth (FFCY)",
    "Global Payment Program (GPP)", "Health Equity",
    "Health-Related Social Needs (HRSN)",
    "Healthy Behavior Incentives",
    "HIV", "Home Community Based Services (HCBS)",
    "Lead Exposure", "Lifetime Limits",
    "Long-Term Services and Supports (LTSS)",
    "Managed Care", "Marketplace Coverage/Premium Assistance Wrap",
    "New Adult Group Expansion", "Non-Eligibility Period",
    "Non-Emergency Medical Transportation (NEMT)",
    "Partial Expansion of the New Adult Group", "Pharmacy", "PHE-Appendix K",
    "PHE-Reasonable Opportunity Period (ROP)", "PHE-Risk Mitigation",
    "PHE-Vaccine Coverage", "Premiums/Cost-Sharing",
    "Provider Cap", "Provider Restriction", "ReEntry",
    "Reproductive Health: Family Planning", "Reproductive Health: Fertility",
    "Reproductive Health: Hyde", "Reproductive Health: Maternal Health",
    "Reproductive Health: Post-Partum Extension", "Reproductive Health: RAD",
    "Retroactive Eligibility", "Serious Mental Illness (SMI)", "Special Needs",
    "Substance Use Disorder (SUD)", "Targeted Population Expansion", "Tribal",
    "Uncompensated Care","Value Based Care (VBC)", "Vision",
  ];
  const demonstrationTypes = ["Section 1115", "Section 1915(b)", "Section 1915(c)"];

  for (let i = 0; i < demonstrationCount; i++) {
    // get a random cms-user
    const person = await prisma().person.findRandom({
      where: { personTypeId: "demos-cms-user" },
      include: {
        personStates: {
          include: { state: true },
        },
      },
    });

    if (!person) {
      throw new Error("No cms users found to assign as project officers");
    }

    let stateSelection = sampleFromArray(person.personStates, 1)[0];
    if (!stateSelection) {
      const fallbackState = await prisma().state.findRandom();
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
      signatureLevel: sampleFromArray([...SIGNATURE_LEVEL, undefined], 1)[0],
      stateId: stateSelection.stateId,
      projectOfficerUserId: person.id,
    };
    await __createDemonstration(undefined, { input: createInput });
  }
  const demonstrations = (await getManyApplications("Demonstration"))!;
  const completenessPhase: PhaseName = "Completeness";
  const incompletePhaseStatus: PhaseStatus = "Incomplete";

  await Promise.all(
    demonstrations.map(async (demonstration, index) => {
      const randomDates = randomDateRange();
      const updatePayload: UpdateDemonstrationInput = {
        effectiveDate: randomDates["start"],
        expirationDate: randomDates["end"],
      };

      /*
       * DEMOS-684 Test Case
       * Need to eventually include seeding for other phases,
       * And correctly seed valid dates, phase statuses, etc...
       */
      if (index === 0) {
        updatePayload.currentPhaseName = completenessPhase;
      }

      const updateInput = {
        id: demonstration.id,
        input: updatePayload,
      };

      await __updateDemonstration(undefined, updateInput);

      if (index === 0) {
        await prisma().applicationPhase.upsert({
          where: {
            applicationId_phaseId: {
              applicationId: demonstration.id,
              phaseId: completenessPhase,
            },
          },
          update: {
            phaseStatusId: incompletePhaseStatus,
          },
          create: {
            applicationId: demonstration.id,
            phaseId: completenessPhase,
            phaseStatusId: incompletePhaseStatus,
          },
        });
      }
    })
  );

  console.log("🌱 Seeding all dates for one demonstration");
  const randomDemonstration = await prisma().demonstration.findRandom({
    select: {
      id: true,
    },
  });
  const dateInput: SetApplicationDatesInput = {
    applicationId: randomDemonstration!.id,
    applicationDates: [
      {
        dateType: "Concept Start Date",
        dateValue: new Date("2025-01-01T00:00:00.000-05:00"),
      },
      {
        dateType: "Pre-Submission Submitted Date",
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
        dateType: "SME Review Date",
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
        dateType: "OGC Review Complete",
        dateValue: new Date("2025-02-10T00:00:00.000-05:00"),
      },
      {
        dateType: "OMB Review Complete",
        dateValue: new Date("2025-02-11T00:00:00.000-05:00"),
      },
      {
        dateType: "PO & OGD Sign-Off",
        dateValue: new Date("2025-02-12T00:00:00.000-05:00"),
      },
      {
        dateType: "Review Completion Date",
        dateValue: new Date("2025-02-13T00:00:00.000-05:00"),
      },
      {
        dateType: "OGC Approval to Share with SMEs",
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
    ],
  };
  await __setApplicationDates(undefined, { input: dateInput });

  console.log("🌱 Seeding amendments...");
  for (let i = 0; i < amendmentCount; i++) {
    const createInput: CreateAmendmentInput = {
      demonstrationId: (await prisma().demonstration.findRandom())!.id,
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
    };
    await __createAmendment(undefined, { input: createInput });
  }
  const amendments = await getManyApplications("Amendment");
  for (const amendment of amendments!) {
    const randomDates = randomDateRange();
    const updatePayload: UpdateAmendmentInput = {
      effectiveDate: randomDates["start"],
      expirationDate: randomDates["end"],
    };
    const updateInput = {
      id: amendment.id,
      input: updatePayload,
    };
    await __updateAmendment(undefined, updateInput);
  }

  console.log("🌱 Seeding extensions...");
  for (let i = 0; i < extensionCount; i++) {
    const createInput: CreateExtensionInput = {
      demonstrationId: (await prisma().demonstration.findRandom())!.id,
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
    };
    await __createExtension(undefined, { input: createInput });
  }
  const extensions = await getManyApplications("Extension");
  for (const extension of extensions!) {
    const randomDates = randomDateRange();
    const updatePayload: UpdateExtensionInput = {
      effectiveDate: randomDates["start"],
      expirationDate: randomDates["end"],
    };
    const updateInput = {
      id: extension.id,
      input: updatePayload,
    };
    await __updateExtension(undefined, updateInput);
  }

  await seedDocuments();
  console.log("🌱 Seeding events (with and without applicationIds)...");

  // Grab some applications for association
  const numberOfApplicationEvents = 10;
  const applicationsForEvents = await prisma().application.findMany({
    select: { id: true },
    take: numberOfApplicationEvents,
  });

  // Grab some users/roles to make events look legit
  const usersForEvents = await prisma().user.findMany({
    select: { id: true, personTypeId: true, cognitoSubject: true },
    take: 5,
  });

  function pick<T>(arr: T[]): T | null {
    if (!arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const totalEvents = numberOfApplicationEvents + 10;

  for (let i = 0; i < totalEvents; i++) {
    // ~60% of events have a applicationId, rest are null
    const attachApplication = Math.random() < 0.6;
    const maybeApplication = attachApplication ? (pick(applicationsForEvents)?.id ?? null) : null;
    const user = pick(usersForEvents) ?? null;

    // Note that these don't really make sense because application is generic
    // Should come back and be more specific as EventType evolves
    const applicationEventTypes: EventType[] = [
      "Create Amendment Succeeded",
      "Create Amendment Failed",
      "Create Demonstration Succeeded",
      "Create Demonstration Failed",
      "Create Extension Succeeded",
      "Create Extension Failed",
      "Delete Demonstration Succeeded",
      "Delete Demonstration Failed",
      "Edit Demonstration Succeeded",
      "Edit Demonstration Failed",
    ];
    const otherEventTypes: EventType[] = ["Login Succeeded", "Logout Succeeded"];
    const eventTypeId = maybeApplication
      ? faker.helpers.arrayElement(applicationEventTypes)
      : faker.helpers.arrayElement(otherEventTypes);

    const systemRoles: Role[] = ["All Users"];
    const demonstrationRoles: Role[] = [
      "Project Officer",
      "Policy Technical Director",
      "Monitoring & Evaluation Technical Director",
      "DDME Analyst",
      "State Point of Contact",
    ];
    const roleId = maybeApplication
      ? faker.helpers.arrayElement(demonstrationRoles)
      : faker.helpers.arrayElement(systemRoles);

    const eventData: LogEventInput = {
      role: roleId,
      applicationId: maybeApplication,
      eventType: eventTypeId,
      logLevel: faker.helpers.arrayElement(["err", "warning", "info"]),
      route: faker.helpers.arrayElement([
        "/applications",
        "/applications/:id",
        "/documents/:id",
        "/login",
        "/graph",
      ]),
      eventData: {
        ip: faker.internet.ipv4(),
        ua: faker.internet.userAgent(),
        note: faker.lorem.sentence(),
      },
    };

    let context: GraphQLContext;
    if (!user) {
      context = {
        user: null,
      };
    } else {
      context = {
        user: {
          id: user.id,
          sub: user.cognitoSubject,
          role: user.personTypeId,
        },
      };
    }

    logEvent(undefined, { input: eventData }, context);
  }

  console.log("✨ Database seeding complete.");
}

seedDatabase().catch((error) => {
  console.error("❌ An error occurred while seeding the database:", error);
});
