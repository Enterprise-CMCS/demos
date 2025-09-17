import { faker } from "@faker-js/faker";
import {
  BUNDLE_TYPE,
  CMCS_DIVISION,
  PERSON_TYPES,
  SIGNATURE_LEVEL,
  PHASE,
  DEMONSTRATION_STATUSES,
} from "./constants.js";
import { prisma } from "./prismaClient.js";
import { DocumentType } from "./types.js";

const PHASE_WITHOUT_NONE = [...PHASE].filter((phase) => phase !== "None");

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

function makeIdStyleString(inputString: string): string {
  return inputString.toUpperCase().replace(/ /g, "_").replace(/\./g, "");
}

function clearDatabase() {
  // Note: the history tables are not truncated in this process
  // Almost always, this runs via npm run seed which empties the DB anyway
  // However, if this does not happen, the history tables will contain the truncates
  return prisma().$transaction([
    // Truncates must be done in proper order for relational reasons
    // Start with join tables
    prisma().rolePermission.deleteMany(),

    // Permissions are only attached to rolePermission
    prisma().permission.deleteMany(),

    // Delete various bundle types
    prisma().modification.deleteMany(),
    prisma().modificationStatus.deleteMany(),
    prisma().demonstration.deleteMany(),
    prisma().demonstrationStatus.deleteMany(),

    // States are only connected to specific bundles and to the join tables
    prisma().state.deleteMany(),

    // Phases and accompanying items
    prisma().bundlePhaseDate.deleteMany(),
    prisma().bundlePhase.deleteMany(),

    // Documents, which are attached to bundles
    prisma().document.deleteMany(),

    // Bundles themselves
    prisma().bundle.deleteMany(),

    // Events, which attach to users and roles
    prisma().event.deleteMany(),

    // delete system role assignments before roles and users
    prisma().systemRoleAssignment.deleteMany(),

    // Finally, roles and users
    prisma().user.deleteMany(),
    prisma().person.deleteMany(),
  ]);
}

async function seedDatabase() {
  checkIfAllowed();
  await clearDatabase();

  // Setting constants for record generation
  const userCount = 9;
  const demonstrationCount = 20;
  const amendmentCount = 10;
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

  console.log("🌱 Seeding states...");
  const states = [
    { name: "Alaska", abbreviation: "AK" },
    { name: "Georgia", abbreviation: "GA" },
    { name: "Hawaii", abbreviation: "HI" },
    { name: "Maryland", abbreviation: "MD" },
    { name: "Vermont", abbreviation: "VT" },
  ];
  for (const state of states) {
    await prisma().state.create({
      data: {
        id: state.abbreviation,
        name: state.name,
      },
    });
  }

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
  // Derive from single source of truth
  const baseStatuses = DEMONSTRATION_STATUSES.map((s) => s.name);

  console.log("🌱 Seeding demonstration statuses...");
  for (const statusName of baseStatuses) {
    await prisma().demonstrationStatus.create({
      data: {
        id: makeIdStyleString(`demonstration_${statusName}`),
        name: statusName,
        description: `${statusName} demonstration.`,
      },
    });
  }

  console.log("🌱 Seeding demonstrations...");
  for (let i = 0; i < demonstrationCount; i++) {
    const bundle = await prisma().bundle.create({
      data: {
        bundleType: {
          connect: { id: BUNDLE_TYPE.DEMONSTRATION },
        },
      },
    });
    await prisma().demonstration.create({
      data: {
        id: bundle.id,
        bundleTypeId: BUNDLE_TYPE.DEMONSTRATION,
        name: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        effectiveDate: faker.date.future(),
        expirationDate: faker.date.future({ years: 1 }),
        cmcsDivisionId: sampleFromArray([...CMCS_DIVISION, null], 1)[0],
        signatureLevelId: sampleFromArray([...SIGNATURE_LEVEL, null], 1)[0],
        demonstrationStatusId: (await prisma().demonstrationStatus.findRandom())!.id,
        stateId: (await prisma().state.findRandom())!.id,
        currentPhaseId: sampleFromArray(PHASE_WITHOUT_NONE, 1)[0],
        projectOfficerUserId: (await prisma().user.findRandom())!.id,
      },
    });
  }

  console.log("🌱 Seeding amendment statuses...");

  for (const statusName of baseStatuses) {
    await prisma().modificationStatus.create({
      data: {
        id: makeIdStyleString(`amendment_${statusName}`),
        name: statusName,
        description: `${statusName} amendment.`,
        bundleTypeId: BUNDLE_TYPE.AMENDMENT,
      },
    });
  }

  console.log("🌱 Seeding extension statuses...");
  for (const statusName of baseStatuses) {
    await prisma().modificationStatus.create({
      data: {
        id: makeIdStyleString(`extension_${statusName}`),
        name: statusName,
        description: `${statusName} extension.`,
        bundleTypeId: BUNDLE_TYPE.EXTENSION,
      },
    });
  }

  console.log("🌱 Seeding amendments...");
  for (let i = 0; i < amendmentCount; i++) {
    const bundle = await prisma().bundle.create({
      data: {
        bundleType: {
          connect: { id: BUNDLE_TYPE.AMENDMENT },
        },
      },
    });
    await prisma().modification.create({
      data: {
        id: bundle.id,
        bundleTypeId: BUNDLE_TYPE.AMENDMENT,
        demonstrationId: (await prisma().demonstration.findRandom())!.id,
        name: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        effectiveDate: faker.date.future(),
        expirationDate: faker.date.future({ years: 1 }),
        modificationStatusId: (await prisma().modificationStatus.findRandom({
          where: { bundleTypeId: BUNDLE_TYPE.AMENDMENT },
        }))!.id,
        currentPhaseId: sampleFromArray(PHASE_WITHOUT_NONE, 1)[0],
        projectOfficerUserId: (await prisma().user.findRandom())!.id,
      },
    });
  }

  const extensionCount = 8;
  console.log("🌱 Seeding extensions...");
  for (let i = 0; i < extensionCount; i++) {
    const bundle = await prisma().bundle.create({
      data: {
        bundleType: {
          connect: { id: BUNDLE_TYPE.EXTENSION },
        },
      },
    });

    await prisma().modification.create({
      data: {
        id: bundle.id,
        bundleTypeId: BUNDLE_TYPE.EXTENSION,
        demonstrationId: (await prisma().demonstration.findRandom())!.id,
        name: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        effectiveDate: faker.date.future(),
        expirationDate: faker.date.future({ years: 1 }),
        modificationStatusId: (await prisma().modificationStatus.findRandom({
          where: { bundleTypeId: BUNDLE_TYPE.EXTENSION },
        }))!.id,
        currentPhaseId: sampleFromArray(PHASE_WITHOUT_NONE, 1)[0],
        projectOfficerUserId: (await prisma().user.findRandom())!.id,
      },
    });
  }

  console.log("🌱 Seeding documents...");
  // Get the application document type
  const applicationDocumentType: DocumentType = "State Application";
  // Every demonstration has an application
  const demonstrationIds = await prisma().demonstration.findMany({
    select: {
      id: true,
    },
  });
  for (const demonstrationId of demonstrationIds) {
    const fakeTitle = faker.lorem.sentence(2);
    await prisma().document.create({
      data: {
        title: fakeTitle,
        description: "Application for " + fakeTitle,
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: applicationDocumentType,
        bundleId: demonstrationId.id,
      },
    });
  }
  // Every amendment and extension has an application
  const amendmentIds = await prisma().modification.findMany({
    select: { id: true },
    where: { bundleTypeId: BUNDLE_TYPE.AMENDMENT },
  });
  for (const amendmentId of amendmentIds) {
    const fakeTitle = faker.lorem.sentence(2);
    await prisma().document.create({
      data: {
        title: fakeTitle,
        description: "Application for " + fakeTitle,
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: applicationDocumentType,
        bundleId: amendmentId.id,
      },
    });
  }
  const extensionIds = await prisma().modification.findMany({
    select: { id: true },
    where: { bundleTypeId: BUNDLE_TYPE.EXTENSION },
  });
  for (const extensionId of extensionIds) {
    const fakeTitle = faker.lorem.sentence(2);
    await prisma().document.create({
      data: {
        title: fakeTitle,
        description: "Application for " + fakeTitle,
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: applicationDocumentType,
        bundleId: extensionId.id,
      },
    });
  }

  // Now, the rest can be largely randomized
  for (let i = 0; i < documentCount; i++) {
    // It is easier to just pull from the DB than to sample randomly from the constant
    const documentTypeId = await prisma().documentType.findRandom({
      select: {
        id: true,
      },
      where: {
        NOT: { id: applicationDocumentType },
      },
    });
    await prisma().document.create({
      data: {
        title: faker.lorem.sentence(2),
        description: faker.lorem.sentence(),
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: documentTypeId!.id,
        bundleId: (await prisma().bundle.findRandom())!.id,
      },
    });
  }

  console.log("✨ Database seeding complete.");
}

seedDatabase().catch((error) => {
  console.error("❌ An error occurred while seeding the database:", error);
});
