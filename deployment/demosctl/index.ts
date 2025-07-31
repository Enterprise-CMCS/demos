#!/usr/bin/env tsx

import { buildClient } from "./commands/buildClient";
import { buildServer } from "./commands/buildServer";
import { getCoreOutputs } from "./commands/getCoreOutputs";
import { fullDeploy } from "./commands/fullDeploy";
import { addCloudfrontRedirect } from "./commands/addCloudfrontRedirect";
import { up } from "./commands/up";
import { down } from "./commands/down";
import { runMigration } from "./commands/runMigration";
import { testMigration } from "./commands/testMigration";

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log("command and environment must be specified");
    process.exit(1);
  }

  const command = args[0];
  const environment = args[1];
  switch (command) {
    case "build:client":
      await buildClient(environment, args[2] == "true");
      break;
    case "build:server":
      await buildServer();
      break;
    case "deploy:core":
      await getCoreOutputs(environment);
      break;
    case "deploy:all":
      await fullDeploy(environment);
      break;
    case "deploy:add-cloudfront-redirect":
      await addCloudfrontRedirect(environment);
      break;
    case "up":
      await up(environment)
      break;
    case "down":
      down(environment);
      break;
    case "migrate":
      runMigration(environment, args[2]);
      break;
    case "test-migration":
      testMigration(environment, args[2]);
      break;
    default:
      console.log(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main();
