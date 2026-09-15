import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { State } from "demos-server";

export const mockStates: State[] = STATES_AND_TERRITORIES.map((state) => ({
  name: state.name,
  id: state.id,
  demonstrations: [],
}));
