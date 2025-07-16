import { faker } from "@faker-js/faker";
import { prisma } from "./prismaClient.js";
import { BUNDLE_TYPE } from "./constants.js";
import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const usersJsonPath = path.join(__dirname, "SWUsersSeeder.json");

export interface USState {
  name: string;
  abbreviation: string;
}

export const AllStatesAndTerritories: USState[] = [
  { name: "Alabama", abbreviation: "AL" }, { name: "Alaska", abbreviation: "AK" }, { name: "Arizona", abbreviation: "AZ" }, { name: "Arkansas", abbreviation: "AR" }, { name: "California", abbreviation: "CA" },
  { name: "Colorado", abbreviation: "CO" }, { name: "Connecticut", abbreviation: "CT" }, { name: "Delaware", abbreviation: "DE" }, { name: "Florida", abbreviation: "FL" }, { name: "Georgia", abbreviation: "GA" }, { name: "Hawaii", abbreviation: "HI" }, { name: "Idaho", abbreviation: "ID" },
  { name: "Illinois", abbreviation: "IL" }, { name: "Indiana", abbreviation: "IN" }, { name: "Iowa", abbreviation: "IA" }, { name: "Kansas", abbreviation: "KS" }, { name: "Kentucky", abbreviation: "KY" }, { name: "Louisiana", abbreviation: "LA" }, { name: "Maine", abbreviation: "ME" },
  { name: "Maryland", abbreviation: "MD" }, { name: "Massachusetts", abbreviation: "MA" }, { name: "Michigan", abbreviation: "MI" }, { name: "Minnesota", abbreviation: "MN" }, { name: "Mississippi", abbreviation: "MS" }, { name: "Missouri", abbreviation: "MO" },
  { name: "Montana", abbreviation: "MT" }, { name: "Nebraska", abbreviation: "NE" }, { name: "Nevada", abbreviation: "NV" }, { name: "New Hampshire", abbreviation: "NH" }, { name: "New Jersey", abbreviation: "NJ" }, { name: "New Mexico", abbreviation: "NM" },
  { name: "New York", abbreviation: "NY" }, { name: "North Carolina", abbreviation: "NC" }, { name: "North Dakota", abbreviation: "ND" }, { name: "Ohio", abbreviation: "OH" }, { name: "Oklahoma", abbreviation: "OK" }, { name: "Oregon", abbreviation: "OR" },
  { name: "Pennsylvania", abbreviation: "PA" }, { name: "Rhode Island", abbreviation: "RI" }, { name: "South Carolina", abbreviation: "SC" }, { name: "South Dakota", abbreviation: "SD" }, { name: "Tennessee", abbreviation: "TN" }, { name: "Texas", abbreviation: "TX" },
  { name: "Utah", abbreviation: "UT" }, { name: "Vermont", abbreviation: "VT" }, { name: "Virginia", abbreviation: "VA" }, { name: "Washington", abbreviation: "WA" }, { name: "West Virginia", abbreviation: "WV" },
  { name: "Wisconsin", abbreviation: "WI" }, { name: "Wyoming", abbreviation: "WY" }, { name: "American Samoa", abbreviation: "AS" }, { name: "District of Columbia", abbreviation: "DC" }, { name: "Federated States of Micronesia", abbreviation: "FM" },
  { name: "Guam", abbreviation: "GU" }, { name: "Marshall Islands", abbreviation: "MH" }, { name: "Northern Mariana Islands", abbreviation: "MP" }, { name: "Palau", abbreviation: "PW" }, { name: "Puerto Rico", abbreviation: "PR" },  { name: "Virgin Islands", abbreviation: "VI" },
];

const rawUserData = JSON.parse(
  fs.readFileSync(usersJsonPath, "utf-8")
);

function checkIfAllowed() {
  if(process.env.ALLOW_SEED !== "true") {
    throw new Error("Database seeding is not allowed. Set ALLOW_SEED=true to use this feature.");
  }
}

export function clearDatabase() {
  checkIfAllowed();

  return prisma().$transaction([
    prisma().rolePermission.deleteMany(),
    prisma().userRole.deleteMany(),
    prisma().userState.deleteMany(),
    prisma().userStateDemonstration.deleteMany(),
    prisma().demonstration.deleteMany(),
    prisma().demonstrationStatus.deleteMany(),
    prisma().permission.deleteMany(),
    prisma().role.deleteMany(),
    prisma().state.deleteMany(),
    prisma().user.deleteMany(),
  ]);
}

async function seedDatabase() {
  checkIfAllowed();

  clearDatabase();


  const entityCount = 100;

  console.log("🌱 Seeding roles...");
  for (let i = 0; i < entityCount; i++) {
    await prisma().role.create({
      data: {
        name: faker.person.jobTitle(),
        description: faker.person.jobDescriptor(),
      },
    });
  }

  console.log("🌱 Seeding states...");
  for (const state of AllStatesAndTerritories) {
    await prisma().state.create({
      data: {
        stateCode: state.abbreviation,
        stateName: state.name,
      },
    });
  }

  console.log("🌱 Seeding users...");
  console.log("🌱 Seeding users from JSON...");

  for (const user of rawUserData) {
    await prisma().user.create({
      data: {
        id: faker.string.uuid(), // generate a random UUID for primary key
        cognitoSubject: faker.string.uuid(),
        username: user.username,
        email: user.email,
        fullName: user.name,
        displayName: user.username,
      },
    });
  }
  console.log("🌱 Seeding permissions...");
  for (let i = 0; i < entityCount; i++) {
    await prisma().permission.create({
      data: {
        name: faker.lorem.word(),
        description: faker.lorem.sentence(),
      },
    });
  }

  console.log("🌱 Seeding demonstration statuses...");
  for (let i = 0; i < entityCount; i++) {
    await prisma().demonstrationStatus.create({
      data: {
        name: faker.lorem.word(),
        description: faker.lorem.sentence(),
      },
    });
  }

  console.log("🌱 Seeding demonstrations...");
  for (let i = 0; i < entityCount; i++) {
    const demonstrationId = faker.string.uuid();

    await prisma().bundle.create({
      data: {
        id: demonstrationId,
        bundleTypeId: BUNDLE_TYPE.DEMONSTRATION
      }
    });

    const status = await prisma().demonstrationStatus.findRandom();
    const state = await prisma().state.findRandom();
    const user = await prisma().user.findRandom();

    if (!status || !state || !user) continue;

    await prisma().demonstration.create({
      data: {
        id: demonstrationId,
        bundleTypeId: BUNDLE_TYPE.DEMONSTRATION,
        name: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        evaluationPeriodStartDate: faker.date.future(),
        evaluationPeriodEndDate: faker.date.future({ years: 1 }),
        demonstrationStatusId: status.id,
        stateId: state.id,
        projectOfficerUserId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  console.log("🔗 Generating entries in join tables...");
  const seenRolePermissions = new Set<string>();
  const seenUserStates = new Set<string>();
  const seenUserStateDemos = new Set<string>();

  for (let i = 0; i < entityCount; i++) {
    try {
      const role = await prisma().role.findRandom();
      const permission = await prisma().permission.findRandom();

      if (role && permission) {
        const pairKey = `${role.id}_${permission.id}`;
        if (!seenRolePermissions.has(pairKey)) {
          seenRolePermissions.add(pairKey);
          await prisma().rolePermission.create({
            data: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }

      const user = await prisma().user.findRandom();
      const demonstration = await prisma().demonstration.findRandom();

      if (user && demonstration) {
        const stateId = demonstration.stateId;
        const userStateKey = `${user.id}_${stateId}`;

        if (!seenUserStates.has(userStateKey)) {
          seenUserStates.add(userStateKey);
          await prisma().userState.create({
            data: {
              userId: user.id,
              stateId,
            },
          });
        }

        const userStateDemoKey = `${user.id}_${stateId}_${demonstration.id}`;
        if (!seenUserStateDemos.has(userStateDemoKey)) {
          seenUserStateDemos.add(userStateDemoKey);
          await prisma().userStateDemonstration.create({
            data: {
              userId: user.id,
              stateId,
              demonstrationId: demonstration.id,
            },
          });
        }
      }
    } catch (error) {
      console.log("Non-critical error in join table generation: " + error);
      continue;
    }
  }
}

seedDatabase().catch((error) => {
  console.error("❌ An error occurred while seeding the database:", error);
});
