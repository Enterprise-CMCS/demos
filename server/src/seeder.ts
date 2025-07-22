import { faker } from "@faker-js/faker";
import { prisma } from "./prismaClient.js";
import { BUNDLE_TYPE } from "./constants.js";

function checkIfAllowed() {
  if(process.env.ALLOW_SEED !== "true") {
    throw new Error("Database seeding is not allowed. Set ALLOW_SEED=true to use this feature.");
  }
};

function shuffleArray<T>(arrayToShuffle: T[]): T[] {
  const shuffledArray = Array.from(arrayToShuffle);
  for (let oldIndex = shuffledArray.length - 1; oldIndex > 0; oldIndex--) {
    const newIndex = Math.floor(Math.random() * (oldIndex + 1));
    const oldValue = shuffledArray[oldIndex];
    const newValue = shuffledArray[newIndex];
    shuffledArray[oldIndex] = newValue;
    shuffledArray[newIndex] = oldValue;
  };
  return shuffledArray;
};

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
    prisma().userStateDemonstration.deleteMany(),
    prisma().userState.deleteMany(),
    prisma().rolePermission.deleteMany(),
    prisma().userRole.deleteMany(),

    // Permissions are only attached to rolePermission
    prisma().permission.deleteMany(),

    // Delete various bundle types
    prisma().demonstration.deleteMany(),
    prisma().demonstrationStatus.deleteMany(),
    prisma().modification.deleteMany(),
    prisma().modificationStatus.deleteMany(),

    // States are only connected to specific bundles and to the join tables
    prisma().state.deleteMany(),

    // Documents, which are attached to bundles
    prisma().document.deleteMany(),
    prisma().documentType.deleteMany(),

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
  const syntheticEventCount = 140;
  const syntheticEventTypeCount = 10;

  console.log("🌱 Generating synthetic event types...");
  const syntheticEventTypeValues = [];
  for (let i = 0; i < syntheticEventTypeCount; i++) {
    syntheticEventTypeValues.push({
      eventTypeId: faker.lorem.sentence(2).toLocaleUpperCase().replace(" ", "_").replace(".", ""),
      logLevelId: (await prisma().logLevel.findRandom({ select: { id: true } }))!.id,
      route: "/" + faker.lorem.word() + "/" + faker.lorem.word() + "/" + faker.lorem.word()
    });
  };

  console.log("🌱 Generating bypassed user and accompanying records...");
  const bypassUserId = "00000000-1111-2222-3333-123abc123abc";
  const bypassUserSub = "1234abcd-0000-1111-2222-333333333333";
  const bypassRoleId = "abcdef09-0000-0000-0000-123412341234";
  const bypassPermissionId = "aaaaaaaa-0000-0000-0000-ffffffffffff";
  await prisma().user.create({
    data: {
      id: bypassUserId,
      cognitoSubject: bypassUserSub,
      username: "BYPASSED_USER",
      email: "bypassedUser@email.com",
      fullName: "Bypassed J. User",
      displayName: "Bypass"
    }
  });
  await prisma().role.create({
    data: {
      id: bypassRoleId,
      name: "Bypassed Admin Role",
      description: "This role is a testing role for the bypassed user and is not a real role."
    }
  });
  await prisma().userRole.create({
    data: {
      userId: bypassUserId,
      roleId: bypassRoleId
    }
  })
  await prisma().permission.create({
    data: {
      id: bypassPermissionId,
      name: "Bypassed Admin Permission",
      description: "This permission is a testing permission for the bypassed user and is not a real permission."
    }
  });
  await prisma().rolePermission.create({
    data: {
      roleId: bypassRoleId,
      permissionId: bypassPermissionId
    }
  });
  for (let i = 0; i < 10; i++) {
    const eventTypeIndex = Math.floor(Math.random() * syntheticEventTypeValues.length);
    await prisma().event.create({
      data: {
        userId: bypassUserId,
        activeUserId: bypassUserId,
        eventTypeId: syntheticEventTypeValues[eventTypeIndex].eventTypeId,
        roleId: bypassRoleId,
        activeRoleId: bypassRoleId,
        logLevelId: syntheticEventTypeValues[eventTypeIndex].logLevelId,
        route: syntheticEventTypeValues[eventTypeIndex].route,
        createdAt: faker.date.past(),
        eventData: {
          "key": faker.lorem.word(),
          "value": faker.lorem.sentence()
        }
      }
    });
  };

  console.log("🌱 Seeding roles...");
  for (let i = 0; i < roleCount; i++) {
    await prisma().role.create({
      data: {
        name: faker.person.jobTitle(),
        description: faker.person.jobDescriptor(),
      },
    });
  };

  console.log("🌱 Seeding states...");
  const states = [
    { name: "Alaska", abbreviation: "AK" },
    { name: "Georgia", abbreviation: "GA" },
    { name: "Hawaii", abbreviation: "HI" },
    { name: "Maryland", abbreviation: "MD" },
    { name: "Vermont", abbreviation: "VT" }
  ];
  for (const state of states) {
    await prisma().state.create({
      data: {
        stateCode: state.abbreviation,
        stateName: state.name,
      },
    });
  };

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
  };

  console.log("🌱 Seeding permissions...");
  for (let i = 0; i < permissionCount; i++) {
    await prisma().permission.create({
      data: {
        name: faker.lorem.word(),
        description: faker.lorem.sentence(),
      },
    });
  };

  console.log("🌱 Seeding demonstration statuses...");
  const demonstrationStatuses = [
    { name: "New", description: "New" },
    { name: "In Progress", description: "In Progress" },
    { name: "Completed", description: "Completed" }
  ];
  for (const status of demonstrationStatuses) {
    await prisma().demonstrationStatus.create({
      data: {
        name: status.name,
        description: status.description,
      },
    });
  };

  console.log("🌱 Seeding demonstrations...");
  for (let i = 0; i < demonstrationCount; i++) {
    const bundle = await prisma().bundle.create({
      data: {
        bundleType: {
          connect: { id: BUNDLE_TYPE.DEMONSTRATION }
        }
      }
    });
    await prisma().demonstration.create({
      data: {
        id: bundle.id,
        bundleTypeId: BUNDLE_TYPE.DEMONSTRATION,
        name: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        evaluationPeriodStartDate: faker.date.future(),
        evaluationPeriodEndDate: faker.date.future({ years: 1 }),
        demonstrationStatusId: (await prisma().demonstrationStatus.findRandom())!.id,
        stateId: (await prisma().state.findRandom())!.id,
        projectOfficerUserId: (await prisma().user.findRandom())!.id,
      },
    });
  };

  console.log("🌱 Seeding amendment statuses...");
  const modificationStatuses = [
    { id: "NEW", description: "New amendment." },
    { id: "IN_PROGRESS", description: "Amendment is in progress." },
    { id: "COMPLETED", description: "Completed amendment." }
  ];
  for (const status of modificationStatuses) {
    await prisma().modificationStatus.create({
      data: {
        id: status.id,
        bundleTypeId: BUNDLE_TYPE.AMENDMENT,
        description: status.description
      },
    });
  };

  console.log("🌱 Seeding amendments...");
  for (let i = 0; i < amendmentCount; i++) {
    const bundle = await prisma().bundle.create({
      data: {
        bundleType: {
          connect: { id: BUNDLE_TYPE.AMENDMENT }
        }
      }
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
        modificationStatusId: (await prisma().modificationStatus.findRandom())!.id,
        projectOfficerUserId: (await prisma().user.findRandom())!.id,
      },
    });
  };

  console.log("🌱 Seeding document types...");
  const documentTypes = [
    { id: "DEMONSTRATION_APPLICATION", description: "Demonstration application file." },
    { id: "BUDGET_PROPOSAL", description: "Proposed budget for the project." },
    { id: "ELECTED_OFFICAL_ENDORSEMENT", description: "Endorsement by elected official." },
    { id: "COI_DISCLOSURE", description: "Conflict of interest disclosure." },
    { id: "DEVIATION_REPORT", description: "Report of a deviation." },
    { id: "EXPENSE_TABLE", description: "Expense table." },
    { id: "INTENTIONALLY_OMITTED", description: "A document type intended not to be used, to allow for zero-count joins." },
    { id: "AMENDMENT_APPLICATION", description: "Application for an amendment." }
  ];
  for (const documentType of documentTypes) {
    await prisma().documentType.create({
      data: {
        id: documentType.id,
        description: documentType.description,
      },
    });
  };

  console.log("🌱 Seeding documents...");
  // Every demonstration has an application
  const demonstrationIds = await prisma().demonstration.findMany({
    select: {
      id: true
    }
  });
  for (const demonstrationId of demonstrationIds) {
    const fakeTitle = faker.lorem.sentence(2);
    await prisma().document.create({
      data: {
        title: fakeTitle,
        description: "Application for " + fakeTitle,
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: "DEMONSTRATION_APPLICATION",
        bundleId: demonstrationId.id
      }
    });
  };
  // Every amendment has an application
  const amendmentIds = await prisma().modification.findMany({
    select: {
      id: true
    },
    where: {
      bundleTypeId: BUNDLE_TYPE.AMENDMENT
    }
  });
  for (const amendmentId of amendmentIds) {
    const fakeTitle = faker.lorem.sentence(2);
    await prisma().document.create({
      data: {
        title: fakeTitle,
        description: "Application for " + fakeTitle,
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: "DEMONSTRATION_APPLICATION",
        bundleId: amendmentId.id
      }
    });
  };
  // Now, the rest can be largely randomized
  for (let i = 0; i < documentCount; i++) {
    const documentTypeId = await prisma().documentType.findRandom({
      select: {
        id: true
      },
      where: {
        NOT: {
          id: {
            in: [
              "DEMONSTRATION_APPLICATION",
              "INTENTIONALLY_OMITTED",
              "AMENDMENT_APPLICATION"
            ]
          }
        }
      }
    });
    await prisma().document.create({
      data: {
        title: faker.lorem.sentence(2),
        description: faker.lorem.sentence(),
        s3Path: "s3://" + faker.lorem.word() + "/" + faker.lorem.word(),
        ownerUserId: (await prisma().user.findRandom())!.id,
        documentTypeId: documentTypeId!.id,
        bundleId: (await prisma().bundle.findRandom())!.id
      },
    });
  };

  // Getting IDs for join tables and events
  // Note we exclude the bypass user to avoid conflicts
  const roleIds = await prisma().role.findMany({
    select: { id: true },
    where: {
      NOT: {
        id: bypassRoleId
      }
    }
  });
  const stateIds = await prisma().state.findMany({
    select: { id: true }
  });
  const userIds = await prisma().user.findMany({
    select: { id: true },
    where: {
      NOT: {
        id: bypassUserId
      }
    }
  });
  const permissionIds = await prisma().permission.findMany({
    select: { id: true },
    where: {
      NOT: {
        id: bypassPermissionId
      }
    }
  });

  console.log("🔗 Assigning permissions to roles...");
  for (const roleId of roleIds) {
    const assignedPermissionIds = sampleFromArray(permissionIds, 2);
    for (let i = 0; i < assignedPermissionIds.length; i++) {
      await prisma().rolePermission.create({
        data: {
          roleId: roleId.id,
          permissionId: assignedPermissionIds[i].id
        }
      });
    };
  };

  console.log("🔗 Assigning users to roles...");
  for (const userId of userIds) {
    const assignedRoleIds = sampleFromArray(roleIds, 2);
    for (let i = 0; i < assignedRoleIds.length; i++) {
      await prisma().userRole.create({
        data: {
          userId: userId.id,
          roleId: assignedRoleIds[i].id
        }
      });
    };
  };

  console.log("🔗 Assigning users to states...");
  for (const userId of userIds) {
    const assignedStateIds = sampleFromArray(stateIds, 2);
    for (let i = 0; i < assignedStateIds.length; i++) {
      await prisma().userState.create({
        data: {
          userId: userId.id,
          stateId: assignedStateIds[i].id
        }
      });
    };
  };

  console.log("🔗 Assigning users to demonstrations...");
  const demonstrationStates = await prisma().demonstration.findMany({
    select: {
      id: true,
      stateId: true
    }
  });
  const userStates = await prisma().userState.findMany({
    select: {
      userId: true,
      stateId: true
    }
  });
  const userStateDemonstrationValues = [];
  for (const userState of userStates) {
    for (const demonstrationState of demonstrationStates) {
      if (userState.stateId === demonstrationState.stateId) {
        userStateDemonstrationValues.push({
          userId: userState.userId,
          stateId: userState.stateId,
          demonstrationId: demonstrationState.id
        });
      };
    };
  };
  for (const userStateDemonstrationValue of userStateDemonstrationValues) {
    await prisma().userStateDemonstration.create({
      data: {
        userId: userStateDemonstrationValue.userId,
        stateId: userStateDemonstrationValue.stateId,
        demonstrationId: userStateDemonstrationValue.demonstrationId
      }
    });
  };

  const userRoleIds = await prisma().userRole.findMany({
    where: {
      NOT: {
        userId: bypassUserId
      }
    }
  });
  console.log("🌱 Seeding events...");
  for (let i = 0; i < syntheticEventCount; i++) {
    const eventTypeIndex = Math.floor(Math.random() * syntheticEventTypeValues.length);
    const userRoleIndex = Math.floor(Math.random() * userRoleIds.length);
    await prisma().event.create({
      data: {
        userId: userRoleIds[userRoleIndex].userId,
        activeUserId: userRoleIds[userRoleIndex].userId,
        eventTypeId: syntheticEventTypeValues[eventTypeIndex].eventTypeId,
        roleId: userRoleIds[userRoleIndex].roleId,
        activeRoleId: userRoleIds[userRoleIndex].roleId,
        logLevelId: syntheticEventTypeValues[eventTypeIndex].logLevelId,
        route: syntheticEventTypeValues[eventTypeIndex].route,
        createdAt: faker.date.past(),
        eventData: {
          "key": faker.lorem.word(),
          "value": faker.lorem.sentence()
        }
      }
    });
  };

  console.log(
    "✨ Database seeding complete.",
  );
};

seedDatabase().catch((error) => {
  console.error("❌ An error occurred while seeding the database:", error);
});
