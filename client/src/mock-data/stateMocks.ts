import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { State } from "demos-server";

export const california: State = {
  id: "CA",
  name: "California",
  demonstrations: [],
};

export type MockState = Pick<State, "name" | "id"> & {
  __typename: "State";
};

export const mockStates: MockState[] = STATES_AND_TERRITORIES.map((state) => ({
  __typename: "State",
  name: state.name,
  id: state.id,
}));
