import { spawnSync } from "child_process";

function executeSqlFile(filePath: string): void {
  console.log(`Executing SQL file: ${filePath}`);
  const result = spawnSync(
    "npx",
    ["prisma", "db", "execute", "--schema", "./src/model/schema.prisma", "--file", filePath],
    { stdio: "inherit" }
  );

  if (result.error) {
    console.error(`Error spawning process for ${filePath}:`, result.error);
    process.exit(result.status ?? 1);
  }
  if (result.status !== 0) {
    console.error(`prisma db execute failed for ${filePath} with exit code ${result.status}`);
    process.exit(result.status);
  }
}

executeSqlFile("./src/sql/utility_views.sql");
executeSqlFile("./src/sql/permissions.sql");
executeSqlFile("./src/sql/history_triggers.sql");
executeSqlFile("./src/sql/functions.sql");
