import { faker } from "@faker-js/faker";

import { BUNDLE_TYPE, CMCS_DIVISION, SIGNATURE_LEVEL } from "./constants.js";
import { prisma } from "./prismaClient.js";
import { DocumentType } from "./types.js";

function checkIfAllowed() {
  if (process.env.ALLOW_SEED !== "true") {
    throw new Error(
      "Database seeding is not allowed. Set ALLOW_SEED=true to use this feature.",
    );
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
    prisma().userStateDemonstration.deleteMany(),
    prisma().userState.deleteMany(),
    prisma().rolePermission.deleteMany(),
    prisma().userRole.deleteMany(),

    // Permissions are only attached to rolePermission
    prisma().permission.deleteMany(),

    // Delete various bundle types
    prisma().modification.deleteMany(),
    prisma().modificationStatus.deleteMany(),
    prisma().demonstration.deleteMany(),
    prisma().demonstrationStatus.deleteMany(),

    // States are only connected to specific bundles and to the join tables
    prisma().state.deleteMany(),

    // Documents, which are attached to bundles
    prisma().document.deleteMany(),

    // Bundles themselves
    prisma().bundle.deleteMany(),

    // Events, which attach to users and roles
    prisma().event.deleteMany(),

    // Finally, roles and users
    prisma().role.deleteMany(),
    prisma().user.deleteMany(),
  ]);
}

async function seedDatabase() {
  checkIfAllowed();
  await clearDatabase();

  // Setting constants for record generation
  const roleCount = 4;
  const userCount = 9;
  const permissionCount = 9;
  const demonstrationCount = 20;
  const amendmentCount = 10;
  const documentCount = 130;

  console.log("🌱 Generating bypassed user and accompanying records...");
  const bypassUserId = "00000000-1111-2222-3333-123abc123abc";
  const bypassUserSub = "1234abcd-0000-1111-2222-333333333333";
  const bypassRoleId = "BYPASSED_ADMIN_ROLE";
  const bypassPermissionId = "BYPASSED_ADMIN_PERMISSION";
  await prisma().user.create({
    data: {
      id: bypassUserId,
      cognitoSubject: bypassUserSub,
      username: "BYPASSED_USER",
      email: "bypassedUser@email.com",
      fullName: "Bypassed J. User",
      displayName: "Bypass",
    },
  });
  await prisma().role.create({
    data: {
      id: bypassRoleId,
      name: "Bypassed Admin Role",
      description:
        "This role is a testing role for the bypassed user and is not a real role.",
    },
  });
  await prisma().userRole.create({
    data: {
      userId: bypassUserId,
      roleId: bypassRoleId,
    },
  });
  await prisma().permission.create({
    data: {
      id: bypassPermissionId,
      name: "Bypassed Admin Permission",
      description:
        "This permission is a testing permission for the bypassed user and is not a real permission.",
    },
  });
  await prisma().rolePermission.create({
    data: {
      roleId: bypassRoleId,
      permissionId: bypassPermissionId,
    },
  });

  console.log("🌱 Seeding roles...");
  for (let i = 0; i < roleCount; i++) {
    const title = faker.person.jobTitle();
    await prisma().role.create({
      data: {
        id: makeIdStyleString(title),
        name: title,
        description: faker.person.jobDescriptor(),
      },
    });
  }

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

  console.log("🌱 Seeding users...");
  for (let i = 0; i < userCount; i++) {
    await prisma().user.create({
      data: {
        cognitoSubject: faker.string.uuid(),
        username: faker.internet.username(),
        email: faker.internet.email(),
        fullName: faker.person.fullName(),
        displayName: faker.internet.username(),
      },
    });
  }

  console.log("🌱 Seeding permissions...");
  for (let i = 0; i < permissionCount; i++) {
    const permissionName = sampleFromArray(
      [
        faker.lorem.sentence(1),
        faker.lorem.sentence(2),
        faker.lorem.sentence(3),
      ],
      1,
    );

    await prisma().permission.create({
      data: {
        id: makeIdStyleString(permissionName[0]),
        name: permissionName[0],
        description: faker.lorem.sentence(),
      },
    });
  }

  console.log("🌱 Seeding demonstration statuses...");
  const demonstrationStatuses = [
    { name: "New", description: "New" },
    { name: "In Progress", description: "In Progress" },
    { name: "Completed", description: "Completed" },
  ];
  for (const status of demonstrationStatuses) {
    await prisma().demonstrationStatus.create({
      data: {
        id: makeIdStyleString(status.name),
        name: status.name,
        description: status.description,
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
        demonstrationStatusId:
          (await prisma().demonstrationStatus.findRandom())!.id,
        stateId: (await prisma().state.findRandom())!.id,
        projectOfficerUserId: (await prisma().user.findRandom())!.id,
      },
    });
  }

  console.log("🌱 Seeding amendment statuses...");
  const baseStatuses = ["New", "In Progress", "On Hold", "Completed"];

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
        }
      })
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

  // Getting IDs for join tables and events
  // Note we exclude the bypass user to avoid conflicts
  const roleIds = await prisma().role.findMany({
    select: { id: true },
    where: {
      NOT: {
        id: bypassRoleId,
      },
    },
  });
  const stateIds = await prisma().state.findMany({
    select: { id: true },
  });
  const userIds = await prisma().user.findMany({
    select: { id: true },
    where: {
      NOT: {
        id: bypassUserId,
      },
    },
  });
  const permissionIds = await prisma().permission.findMany({
    select: { id: true },
    where: {
      NOT: {
        id: bypassPermissionId,
      },
    },
  });

  console.log("🔗 Assigning permissions to roles...");
  for (const roleId of roleIds) {
    const assignedPermissionIds = sampleFromArray(permissionIds, 2);
    for (let i = 0; i < assignedPermissionIds.length; i++) {
      await prisma().rolePermission.create({
        data: {
          roleId: roleId.id,
          permissionId: assignedPermissionIds[i].id,
        },
      });
    }
  }

  console.log("🔗 Assigning users to roles...");
  for (const userId of userIds) {
    const assignedRoleIds = sampleFromArray(roleIds, 2);
    for (let i = 0; i < assignedRoleIds.length; i++) {
      await prisma().userRole.create({
        data: {
          userId: userId.id,
          roleId: assignedRoleIds[i].id,
        },
      });
    }
  }

  console.log("🔗 Assigning users to states...");
  for (const userId of userIds) {
    const assignedStateIds = sampleFromArray(stateIds, 2);
    for (let i = 0; i < assignedStateIds.length; i++) {
      await prisma().userState.create({
        data: {
          userId: userId.id,
          stateId: assignedStateIds[i].id,
        },
      });
    }
  }

  console.log("🔗 Assigning users to demonstrations...");
  const demonstrationStates = await prisma().demonstration.findMany({
    select: {
      id: true,
      stateId: true,
    },
  });
  const userStates = await prisma().userState.findMany({
    select: {
      userId: true,
      stateId: true,
    },
  });
  const userStateDemonstrationValues = [];
  for (const userState of userStates) {
    for (const demonstrationState of demonstrationStates) {
      if (userState.stateId === demonstrationState.stateId) {
        userStateDemonstrationValues.push({
          userId: userState.userId,
          stateId: userState.stateId,
          demonstrationId: demonstrationState.id,
        });
      }
    }
  }
  for (const userStateDemonstrationValue of userStateDemonstrationValues) {
    await prisma().userStateDemonstration.create({
      data: {
        userId: userStateDemonstrationValue.userId,
        stateId: userStateDemonstrationValue.stateId,
        demonstrationId: userStateDemonstrationValue.demonstrationId,
      },
    });
  }

  console.log("✨ Database seeding complete.");
}

seedDatabase().catch((error) => {
  console.error("❌ An error occurred while seeding the database:", error);
});
