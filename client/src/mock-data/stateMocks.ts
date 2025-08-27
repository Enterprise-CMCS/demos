import { states } from "data/StatesAndTerritories";
import { State } from "demos-server";

export const california: State = {
  id: "CA",
  name: "California",
  users: [],
  demonstrations: [],
};

export const stateOptions: Pick<State, "name" | "id">[] = states.map((state) => ({
  name: state.name,
  id: state.abbrev,
}));
