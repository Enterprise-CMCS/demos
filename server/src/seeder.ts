import { faker } from "@faker-js/faker";
import { BUNDLE_TYPE, CMCS_DIVISION, PERSON_TYPES, SIGNATURE_LEVEL } from "./constants.js";
import {
  CreateDemonstrationInput,
  CreateAmendmentInput,
  CreateExtensionInput,
  UpdateDemonstrationInput,
  UpdateAmendmentInput,
  UpdateExtensionInput,
} from "./types.js";
import { prisma } from "./prismaClient.js";
import { DocumentType } from "./types.js";
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
    prisma().demonstration.deleteMany(),

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
        personTypeId: PERSON_TYPES[i % (PERSON_TYPES.length - 1)],
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
  console.log("🌱 Seeding demonstrations...");
  for (let i = 0; i < demonstrationCount; i++) {
    const createInput: CreateDemonstrationInput = {
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      cmcsDivision: sampleFromArray([...CMCS_DIVISION, undefined], 1)[0],
      signatureLevel: sampleFromArray([...SIGNATURE_LEVEL, undefined], 1)[0],
      stateId: (await prisma().state.findRandom())!.id,
      projectOfficerUserId: (await prisma().user.findRandom())!.id,
    };
    await createDemonstration(undefined, { input: createInput });
  }
  const demonstrations = await getManyDemonstrations();
  for (const demonstration of demonstrations) {
    const updatePayload: UpdateDemonstrationInput = {
      effectiveDate: faker.date.future({ years: 1 }),
      expirationDate: faker.date.future({ years: 2 }),
    };
    const updateInput = {
      id: demonstration.id,
      input: updatePayload,
    };
    await updateDemonstration(undefined, updateInput);
  }

  console.log("🌱 Seeding amendments...");
  for (let i = 0; i < amendmentCount; i++) {
    const createInput: CreateAmendmentInput = {
      demonstrationId: (await prisma().demonstration.findRandom())!.id,
      name: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      projectOfficerUserId: (await prisma().user.findRandom())!.id,
    };
    await createAmendment(undefined, { input: createInput });
  }
  const amendments = await getManyAmendments();
  for (const amendment of amendments) {
    const updatePayload: UpdateAmendmentInput = {
      effectiveDate: faker.date.future({ years: 1 }),
      expirationDate: faker.date.future({ years: 2 }),
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
      projectOfficerUserId: (await prisma().user.findRandom())!.id,
    };
    await createExtension(undefined, { input: createInput });
  }
  const extensions = await getManyExtensions();
  for (const extension of extensions) {
    const updatePayload: UpdateExtensionInput = {
      effectiveDate: faker.date.future({ years: 1 }),
      expirationDate: faker.date.future({ years: 2 }),
    };
    const updateInput = {
      id: extension.id,
      input: updatePayload,
    };
    await updateExtension(undefined, updateInput);
  }

  console.log("🌱 Seeding documents...");
  // Get the application document type
  const applicationDocumentType: DocumentType = "State Application";
  for (const demonstration of demonstrations) {
    const fakeTitle = faker.lorem.sentence(2);
    await prisma().document.create({
      data: {
        title: fakeTitle,
        description: "Application for " + fakeTitle,
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: applicationDocumentType,
        bundleId: demonstration.id,
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
