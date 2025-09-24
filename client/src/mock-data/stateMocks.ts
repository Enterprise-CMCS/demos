import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { State } from "demos-server";

export type MockState = Pick<State, "name" | "id">;

export const mockStates: MockState[] = STATES_AND_TERRITORIES.map((state) => ({
  name: state.name,
  id: state.id,
}));
