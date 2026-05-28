import { generateDemonstration } from "./generateDemonstration";
import { assignPersonToState } from "./assignPersonToState";
import { generateUser } from "./generateUser";
import { progressThroughPhase } from "./completePhase/progressThroughPhase";
import { PHASE_NAMES } from "../constants";
import { TZDate } from "@date-fns/tz";
import { addDays } from "date-fns";

const user = await generateUser({
  firstName: "Admin",
  lastName: "User",
  personTypeId: "demos-admin",
});

await assignPersonToState(user.id, "NY");

await generateDemonstration({
  name: "Basic Demonstration" + new Date().toISOString(),
  state: "NY",
  projectOfficerUserId: user.id,
});

for (const phaseName of PHASE_NAMES) {
  const demonstration = await generateDemonstration({
    name: `Demonstration in ${phaseName} Phase - ${new Date().toISOString()}`,
    state: "NY",
    projectOfficerUserId: user.id,
  });

  await progressThroughPhase(demonstration.id, phaseName, user.id, addDays(new TZDate(), -90));
}
