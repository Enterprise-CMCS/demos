import { Umzug, SequelizeStorage } from "umzug";
import { sequelize } from "./db.js";

const umzug = new Umzug({
  migrations: { glob: "src/db/migrations/*.js" },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({
    sequelize,
    schema: "demos_app",
    modelName: "_sequelize_umzug_migrations",
  }),
  logger: console,
});

async function runUp(targetMigration) {
  let migrations;
  if (targetMigration) {
    console.log(`Attempting to apply Umzug migration(s) to ${targetMigration}`);
    migrations = await umzug.up({ to: targetMigration });
  } else {
    console.log("Attempting to apply all pending Umzug migrations");
    migrations = await umzug.up();
  }
  if (migrations.length) {
    console.log(`Applied Umzug migration(s): ${migrations.map((m) => m.name).join(", ")}`);
  } else {
    console.log("No migrations to apply.");
  }
}

async function runDown(targetMigration) {
  let migrations;
  if (targetMigration) {
    console.log(`Attempting to roll back Umzug migration(s) to ${targetMigration}`);
    migrations = await umzug.down({ to: targetMigration });
  } else {
    console.log("Attempting to roll back last Umzug migration");
    migrations = await umzug.down();
  }
  if (migrations.length) {
    console.log(`Rolled back Umzug migration(s): ${migrations.map((m) => m.name).join(", ")}`);
  } else {
    console.log("No migrations to roll back.");
  }
}

async function runReset() {
  await umzug.down({ to: 0 });
  console.log("Rolled back all Umzug migrations");
}

async function runStatus() {
  const executed = await umzug.executed();
  const pending = await umzug.pending();
  console.log("\nExecuted Umzug migrations:");
  executed.forEach((m) => console.log(`  ✓ ${m.name}`));
  console.log("\nPending Umzug migrations:");
  pending.forEach((m) => console.log(`  ☐ ${m.name}`));
}

async function main() {
  const command = process.argv[2];
  const tgtMigration = process.argv[3];
  try {
    switch (command) {
      case "up":
        await runUp(tgtMigration);
        process.exit(0);
      case "down":
        await runDown(tgtMigration);
        process.exit(0);
      case "reset":
        await runReset();
        process.exit(0);
      case "status":
        await runStatus();
        process.exit(0);
      default:
        console.error(
          "Unknown command. Use 'up [optional-migration]', 'down [optional-migration]', 'reset', or 'status'."
        );
        process.exit(1);
    }
  } catch (err) {
    console.error("Migration runner error:", err);
    process.exit(2);
  } finally {
    await sequelize.close();
  }
}

main();
