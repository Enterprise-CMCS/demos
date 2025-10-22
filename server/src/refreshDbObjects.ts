import { spawnSync } from "child_process";

function executeSqlFile(filePath: string): void {
  console.log(`Executing SQL file: ${filePath}`);
  spawnSync("prisma", [
    "db",
    "execute",
    "--schema",
    "./src/model/schema.prisma",
    "--file",
    filePath,
  ]);
}

executeSqlFile("./src/sql/utility_views.sql");
executeSqlFile("./src/sql/permissions.sql");
executeSqlFile("./src/sql/history_triggers.sql");
executeSqlFile("./src/sql/functions.sql");
