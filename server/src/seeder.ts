import { faker } from "@faker-js/faker";
import { prisma } from "./prismaClient.js";

function checkIfAllowed() {
  if(process.env.ALLOW_SEED !== "true") {
    throw new Error("Database seeding is not allowed. Set ALLOW_SEED=true to use this feature.");
  }
}

export function clearDatabase() {
  checkIfAllowed();

  return prisma.$transaction([
    prisma.event.deleteMany(),
    prisma.rolePermission.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.userState.deleteMany(),
    prisma.userStateDemonstration.deleteMany(),
    prisma.demonstration.deleteMany(),
    prisma.demonstrationStatus.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.role.deleteMany(),
    prisma.state.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function seedDatabase() {
  checkIfAllowed();
  
  clearDatabase();


  const entityCount = 100;

  console.log("🌱 Seeding roles...");
  for (let i = 0; i < entityCount; i++) {
    await prisma.role.create({
      data: {
        name: faker.person.jobTitle(),
        description: faker.person.jobDescriptor(),
      },
    });
  }

  console.log("🌱 Seeding states...");
  const states = [
    { name: "Alabama", abbreviation: "AL" },
    { name: "Alaska", abbreviation: "AK" },
    { name: "Arizona", abbreviation: "AZ" },
    { name: "Arkansas", abbreviation: "AR" },
    { name: "California", abbreviation: "CA" },
    { name: "Colorado", abbreviation: "CO" },
    { name: "Connecticut", abbreviation: "CT" },
    { name: "Delaware", abbreviation: "DE" },
    { name: "Florida", abbreviation: "FL" },
    { name: "Georgia", abbreviation: "GA" },
  ];
  for (const state of states) {
    await prisma.state.create({
      data: {
        stateCode: state.abbreviation,
        stateName: state.name,
      },
    });
  }

  console.log("🌱 Seeding users...");
  for (let i = 0; i < entityCount; i++) {
    await prisma.user.create({
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
  for (let i = 0; i < entityCount; i++) {
    await prisma.permission.create({
      data: {
        name: faker.lorem.word(),
        description: faker.lorem.sentence(),
      },
    });
  }

  console.log("🌱 Seeding demonstration statuses...");
  for (let i = 0; i < entityCount; i++) {
    await prisma.demonstrationStatus.create({
      data: {
        name: faker.lorem.word(),
        description: faker.lorem.sentence(),
      },
    });
  }

  console.log("🌱 Seeding demonstrations...");
  for (let i = 0; i < entityCount; i++) {
    await prisma.demonstration.create({
      data: {
        name: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        evaluationPeriodStartDate: faker.date.future(),
        evaluationPeriodEndDate: faker.date.future({ years: 1 }),
        demonstrationStatusId: (await prisma.demonstrationStatus.findRandom())!.id,
        stateId: (await prisma.state.findRandom())!.id,
        projectOfficer: (await prisma.user.findRandom())!.id,
      },
    });
  }

  console.log("🌱 Seeding events...");
  const eventTypes = await prisma.eventType.findMany();
  for (let i = 0; i < entityCount * 5; i++) {
    const randomEventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const randomUser = await prisma.user.findRandom();
    
    // For now keep eventData simple and generic
    const eventData = {
      action: faker.lorem.word(),
      details: faker.lorem.sentence()
    };

    await prisma.event.create({
      data: {
        userId: randomUser!.id,
        eventTypeId: randomEventType.id,
        eventData: eventData,
      },
    });
  }

  console.log("🔗 Generating entries in join tables...");
  for (let i = 0; i < entityCount; i++) {
    try {
      await prisma.rolePermission.create({
        data: {
          roleId: (await prisma.role.findRandom())!.id,
          permissionId: (await prisma.permission.findRandom())!.id,
        },
      });
      await prisma.userRole.create({
        data: {
          userId: (await prisma.user.findRandom())!.id,
          roleId: (await prisma.role.findRandom())!.id,
        },
      });

      // need to find valid state-demonstration pairs 
      const state = await prisma.state.findRandom();
      const demonstration = await prisma.demonstration.findRandom();
      const user = await prisma.user.findRandom();

      await prisma.userState.create({
        data: {
          userId: user!.id,
          stateId: state!.id,
        },
      });
      
      await prisma.userStateDemonstration.create({
        data: {
          userId: user!.id,
          stateId: state!.id,
          demonstrationId: demonstration!.id,
        },
      });
    } catch (error) {
      console.log("Non-critical error in join table generation: " + error);

      // if it fails because of a unique constraint, just ignore it and keep going
      continue;
    }
  }
  console.log(
    "✨ Database seeding complete.",
  );
}

seedDatabase().catch((error) => {
  console.error("❌ An error occurred while seeding the database:", error);
});
