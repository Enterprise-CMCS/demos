import { faker } from "@faker-js/faker";
import { TZDate } from "@date-fns/tz";
import { SDG_DIVISIONS, PERSON_TYPES, SIGNATURE_LEVEL } from "./constants.js";
import {
  CreateDemonstrationInput,
  CreateAmendmentInput,
  CreateExtensionInput,
  UpdateDemonstrationInput,
  UpdateAmendmentInput,
  UpdateExtensionInput,
  SetApplicationDateInput,
  EventType,
  LogEventInput,
  Role,
} from "./types.js";
import { prisma } from "./prismaClient.js";
import { DocumentType, PhaseName, PhaseStatus } from "./types.js";
import {
  createDemonstration,
  updateDemonstration,
} from "./model/demonstration/demonstrationResolvers.js";
import {
  getManyAmendments,
  createAmendment,
  updateAmendment,
} from "./model/amendment/amendmentResolvers.js";
import {
  getManyExtensions,
  createExtension,
  updateExtension,
} from "./model/extension/extensionResolvers.js";
import { setApplicationDate } from "./model/applicationDate/applicationDateResolvers.js";
import { logEvent } from "./model/event/eventResolvers.js";
import { GraphQLContext } from "./auth/auth.util.js";
import { getManyApplications } from "./model/application/applicationResolvers.js";

function randomDateRange() {
  const randomStart = faker.date.future({ years: 1 });
  const randomEnd = faker.date.future({ years: 1, refDate: randomStart });

  const randomEasternStart = new TZDate(randomStart, "America/New_York");
  const randomEasternEnd = new TZDate(randomEnd, "America/New_York");

  randomEasternStart.setHours(0, 0, 0, 0);
  randomEasternEnd.setHours(23, 59, 59, 999);

  return { start: randomEasternStart, end: randomEasternEnd };
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
  const documentCount = 130;

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

    const createInput: CreateDemonstrationInput = {
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      sdgDivision: sampleFromArray([...SDG_DIVISIONS, undefined], 1)[0],
      signatureLevel: sampleFromArray([...SIGNATURE_LEVEL, undefined], 1)[0],
      stateId: sampleFromArray(person.personStates, 1)[0].stateId,
      projectOfficerUserId: person.id,
    };
    await createDemonstration(undefined, { input: createInput });
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

      await updateDemonstration(undefined, updateInput);

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
  const datesToSet: SetApplicationDateInput[] = [
    {
      applicationId: randomDemonstration!.id,
      dateType: "Concept Start Date",
      dateValue: new Date("2025-01-01T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "Pre-Submission Submitted Date",
      dateValue: new Date("2025-01-13T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "Concept Completion Date",
      dateValue: new Date("2025-01-16T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "Application Intake Start Date",
      dateValue: new Date("2025-01-16T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "State Application Submitted Date",
      dateValue: new Date("2025-01-23T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "Completeness Review Due Date",
      dateValue: new Date("2025-02-07T23:59:59.999-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "Application Intake Completion Date",
      dateValue: new Date("2025-01-24T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "Completeness Start Date",
      dateValue: new Date("2025-01-24T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "State Application Deemed Complete",
      dateValue: new Date("2025-02-03T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "Federal Comment Period Start Date",
      dateValue: new Date("2025-02-04T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "Federal Comment Period End Date",
      dateValue: new Date("2025-03-06T23:59:59.999-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "Completeness Completion Date",
      dateValue: new Date("2025-02-04T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "SDG Preparation Start Date",
      dateValue: new Date("2025-02-04T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "Expected Approval Date",
      dateValue: new Date("2025-02-05T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "SME Review Date",
      dateValue: new Date("2025-02-06T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "FRT Initial Meeting Date",
      dateValue: new Date("2025-02-07T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "BNPMT Initial Meeting Date",
      dateValue: new Date("2025-02-08T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "SDG Preparation Completion Date",
      dateValue: new Date("2025-02-09T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "OGC & OMB Review Start Date",
      dateValue: new Date("2025-02-09T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "OGC Review Complete",
      dateValue: new Date("2025-02-10T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "OMB Review Complete",
      dateValue: new Date("2025-02-11T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "PO & OGD Sign-Off",
      dateValue: new Date("2025-02-12T00:00:00.000-05:00"),
    },
    {
      applicationId: randomDemonstration!.id,
      dateType: "OGC & OMB Review Completion Date",
      dateValue: new Date("2025-02-13T00:00:00.000-05:00"),
    },
  ];

  for (const dateInput of datesToSet) {
    await setApplicationDate(undefined, { input: dateInput });
  }

  console.log("🌱 Seeding amendments...");
  for (let i = 0; i < amendmentCount; i++) {
    const createInput: CreateAmendmentInput = {
      demonstrationId: (await prisma().demonstration.findRandom())!.id,
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
    };
    await createAmendment(undefined, { input: createInput });
  }
  const amendments = await getManyAmendments();
  for (const amendment of amendments) {
    const randomDates = randomDateRange();
    const updatePayload: UpdateAmendmentInput = {
      effectiveDate: randomDates["start"],
      expirationDate: randomDates["end"],
    };
    const updateInput = {
      id: amendment.id,
      input: updatePayload,
    };
    await updateAmendment(undefined, updateInput);
  }

  console.log("🌱 Seeding extensions...");
  for (let i = 0; i < extensionCount; i++) {
    const createInput: CreateExtensionInput = {
      demonstrationId: (await prisma().demonstration.findRandom())!.id,
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
    };
    await createExtension(undefined, { input: createInput });
  }
  const extensions = await getManyExtensions();
  for (const extension of extensions) {
    const randomDates = randomDateRange();
    const updatePayload: UpdateExtensionInput = {
      effectiveDate: randomDates["start"],
      expirationDate: randomDates["end"],
    };
    const updateInput = {
      id: extension.id,
      input: updatePayload,
    };
    await updateExtension(undefined, updateInput);
  }

  console.log("🌱 Seeding documents...");
  // Get the application document type
  const stateApplicationDocumentType: DocumentType = "State Application";
  const applicationIntakePhaseName: PhaseName = "Application Intake";
  const nonePhaseName: PhaseName = "None";
  for (const demonstration of demonstrations) {
    const fakeName = faker.lorem.sentence(2);
    await prisma().document.create({
      data: {
        name: fakeName,
        description: "Application for " + fakeName,
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: stateApplicationDocumentType,
        applicationId: demonstration.id,
        phaseId: applicationIntakePhaseName,
      },
    });
  }
  // Every amendment and extension has an application
  const amendmentIds = await prisma().amendment.findMany({
    select: { id: true },
  });
  for (const amendmentId of amendmentIds) {
    const fakeName = faker.lorem.sentence(2);
    await prisma().document.create({
      data: {
        name: fakeName,
        description: "Application for " + fakeName,
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: stateApplicationDocumentType,
        applicationId: amendmentId.id,
        phaseId: applicationIntakePhaseName,
      },
    });
  }
  const extensionIds = await prisma().extension.findMany({
    select: { id: true },
  });
  for (const extensionId of extensionIds) {
    const fakeName = faker.lorem.sentence(2);
    await prisma().document.create({
      data: {
        name: fakeName,
        description: "Application for " + fakeName,
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: stateApplicationDocumentType,
        applicationId: extensionId.id,
        phaseId: applicationIntakePhaseName,
      },
    });
  }

  // Now, the rest can be largely randomized
  for (let i = 0; i < documentCount; i++) {
    // It is easier to just pull from the DB than to sample randomly from the constant
    const allowedPhaseDocumentTypes = await prisma().phaseDocumentType.findRandom({
      where: {
        NOT: {
          OR: [{ documentTypeId: stateApplicationDocumentType }, { phaseId: nonePhaseName }],
        },
      },
    });
    await prisma().document.create({
      data: {
        name: faker.lorem.sentence(2),
        description: faker.lorem.sentence(),
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: allowedPhaseDocumentTypes!.documentTypeId,
        applicationId: (await prisma().application.findRandom())!.id,
        phaseId: allowedPhaseDocumentTypes!.phaseId,
      },
    });
  }
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
