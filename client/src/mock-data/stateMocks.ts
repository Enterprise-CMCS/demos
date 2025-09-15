import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { State } from "demos-server";

export const california: State = {
  id: "CA",
  name: "California",
  demonstrations: [],
};

export type MockState = Pick<State, "name" | "id">;

export const mockStates: MockState[] = STATES_AND_TERRITORIES.map((state) => ({
  name: state.name,
  id: state.id,
}));
