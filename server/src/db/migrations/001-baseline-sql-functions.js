import { promises as fs } from "fs";

export async function up({ context: queryInterface }) {
  const sqlFiles = [
    "src/db/sql/drop_utility_views.sql",
    "src/db/sql/create_utility_views.sql",
    "src/db/sql/drop_permissions.sql",
    "src/db/sql/create_permissions.sql",
    "src/db/sql/drop_history_triggers.sql",
    "src/db/sql/create_history_triggers.sql",
    "src/db/sql/drop_functions.sql",
    "src/db/sql/create_functions.sql",
  ];
  for (const filepath of sqlFiles) {
    const sql = await fs.readFile(filepath, "utf8");
    await queryInterface.sequelize.query(sql);
  }
}

export async function down({ context: queryInterface }) {
  const sqlFiles = [
    "src/db/sql/drop_utility_views.sql",
    "src/db/sql/drop_permissions.sql",
    "src/db/sql/drop_history_triggers.sql",
    "src/db/sql/drop_functions.sql",
  ];
  for (const filepath of sqlFiles) {
    const sql = await fs.readFile(filepath, "utf8");
    await queryInterface.sequelize.query(sql);
  }
}
