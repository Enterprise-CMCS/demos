import { confirm } from "../../lib/confirm"
import { runCommand } from "../lib/runCommand"

export async function down(environment: string) {
  if (["prod", "impl", "test", "dev"].includes(environment)) {
    console.log("'down' can only be used for ephemeral environments")
    process.exit(1)
  }

  const confirmed = await confirm(`You are about to destroy the entire '${environment}' environment.\n\nAre you sure you want to continue?\n\nType 'yes' to confirm: `, ["yes"], true)
  if (!confirmed) {
    console.log("Only 'yes' (case-sensitive) is accepted as a confirmation. Cancelling...")
    process.exit(1)
  }

  try {
      await runCommand("down", "npx", [
        "cdk",
        "destroy",
        "--context",
        `stage=${environment}`,
        "--all",
        "--no-change-set",
        "--require-approval=never",
        "--force"
      ]);
  } catch(err) {
    console.log(`deployment failed: ${err}`)
    process.exit(1)
  }

}
