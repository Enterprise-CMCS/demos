import { buildClient } from "./commands/buildClient";
import { buildServer } from "./commands/buildServer";
import { getCoreOutputs } from "./commands/getCoreOutputs";
import { fullDeploy } from "./commands/fullDeploy";
import { addCloudfrontRedirect } from "./commands/addCloudfrontRedirect";
import { up } from "./commands/up";
import { down } from "./commands/down";
import { runMigration } from "./commands/runMigration";
import { testMigration } from "./commands/testMigration";
import { dbReset } from "./commands/dbReset";

export async function main(): Promise<number | null> {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("command and environment must be specified");
    return process.exit(1);
  }

  const command = args[0];
  const environment = args[1];
  switch (command) {
    case "build:client":
      return await buildClient(environment, args[2] == "true");
    case "build:server":
      return await buildServer();
    case "deploy:core":
      return await getCoreOutputs(environment);
    case "deploy:all":
      return await fullDeploy(environment);
    case "deploy:add-cloudfront-redirect":
      return await addCloudfrontRedirect(environment);
    case "up":
      return await up(environment);
    case "down":
      return await down(environment);
    case "migrate":
      return await runMigration(environment, args[2]);
    case "test-migration":
      return await testMigration(environment, args[2]);
    case "db-reset":
      return await dbReset(environment, args[2]);
    default:
      console.error(`Unknown command: ${command}`);
      return 1;
  }
}
