import { MockedResponse } from "@apollo/client/testing";
import { states } from "data/StatesAndTerritories";
import { State } from "demos-server";
import { StateOption } from "hooks/useState";

export const california: State = {
  id: "CA",
  name: "California",
};

export const stateOptions: Pick<State, "name" | "id">[] = states.map((state) => ({
  name: state.name,
  id: state.abbrev,
}));
