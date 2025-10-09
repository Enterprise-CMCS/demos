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
  BundleType,
} from "./types.js";
import { prisma } from "./prismaClient.js";
import { DocumentType, PhaseName } from "./types.js";
import {
  getManyDemonstrations,
  createDemonstration,
  updateDemonstration,
} from "./model/demonstration/demonstrationResolvers.js";
import {
  getManyAmendments,
  getManyExtensions,
  createAmendment,
  createExtension,
  updateAmendment,
  updateExtension,
} from "./model/modification/modificationResolvers.js";

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
    prisma().modification.deleteMany(),
    prisma().primaryDemonstrationRoleAssignment.deleteMany(),
    prisma().demonstrationRoleAssignment.deleteMany(),
    prisma().demonstration.deleteMany(),
    prisma().bundleDate.deleteMany(),
    prisma().bundlePhase.deleteMany(),
    prisma().document.deleteMany(),
    prisma().bundle.deleteMany(),
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
      fullName: "Bypassed J. User",
      displayName: "Bypass",
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
    const person = await prisma().person.create({
      data: {
        personType: {
          connect: { id: PERSON_TYPES[i % (PERSON_TYPES.length - 1)] },
        },
        email: faker.internet.email(),
        fullName: faker.person.fullName(),
        displayName: faker.internet.username(),
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
  const demonstrations = await getManyDemonstrations();
  await Promise.all(
    demonstrations.map((demonstration, index) => {
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
        updatePayload.currentPhaseName = "Federal Comment";
        updatePayload.status = "Under Review";
      }

      const updateInput = {
        id: demonstration.id,
        input: updatePayload,
      };

      return updateDemonstration(undefined, updateInput);
    })
  );

  console.log("🌱 Seeding all dates for one demonstration");
  const randomDemonstration = await prisma().demonstration.findRandom({
    select: {
      id: true,
    },
  });
  for (const dateType of await prisma().dateType.findMany({
    where: { NOT: { id: "Concept Start Date" } },
  })) {
    await prisma().bundleDate.create({
      data: {
        bundleId: randomDemonstration!.id,
        dateTypeId: dateType.id,
        dateValue: faker.date.future({ years: 1 }),
      },
    });
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
  const stateApplicationPhaseName: PhaseName = "State Application";
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
        bundleId: demonstration.id,
        phaseId: stateApplicationPhaseName,
      },
    });
  }
  // Every amendment and extension has an application
  const amendmentIds = await prisma().modification.findMany({
    select: { id: true },
    where: { bundleTypeId: "Amendment" satisfies BundleType },
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
        bundleId: amendmentId.id,
        phaseId: stateApplicationPhaseName,
      },
    });
  }
  const extensionIds = await prisma().modification.findMany({
    select: { id: true },
    where: { bundleTypeId: "Extension" satisfies BundleType },
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
        bundleId: extensionId.id,
        phaseId: stateApplicationPhaseName,
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
        bundleId: (await prisma().bundle.findRandom())!.id,
        phaseId: allowedPhaseDocumentTypes!.phaseId,
      },
    });
  }

  console.log("✨ Database seeding complete.");
}

seedDatabase().catch((error) => {
  console.error("❌ An error occurred while seeding the database:", error);
});
