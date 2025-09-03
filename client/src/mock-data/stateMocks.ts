import { states } from "data/StatesAndTerritories";
import { State } from "demos-server";

export const california: State = {
  id: "CA",
  name: "California",
  users: [],
  demonstrations: [],
};

export type MockState = Pick<State, "name" | "id">;

export const mockStates: MockState[] = states.map((state) => ({
  name: state.name,
  id: state.abbrev,
}));
