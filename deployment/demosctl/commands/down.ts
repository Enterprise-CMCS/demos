import { confirm } from "../lib/confirm";
import { runCommand } from "../lib/runCommand";

export async function down(environment: string) {
  if (["prod", "impl", "test", "dev"].includes(environment)) {
    console.log("'down' can only be used for ephemeral environments");
    return 1;
  }

  const confirmed = await confirm(
    `You are about to destroy the entire '${environment}' environment.\n\nAre you sure you want to continue?\n\nType 'yes' to confirm: `,
    ["yes"],
    true
  );
  if (!confirmed) {
    console.log("Only 'yes' (case-sensitive) is accepted as a confirmation. Cancelling...");
    return 1;
  }

  let exitCode: number = 0;

  try {
    exitCode = await runCommand("down", "npx", [
      "cdk",
      "destroy",
      "--context",
      `stage=${environment}`,
      "--all",
      "--no-change-set",
      "--require-approval=never",
      "--force",
    ]);
  } catch (err) {
    console.error(`deployment failed: ${err}`);
    return 1;
  }

  return exitCode;
}
