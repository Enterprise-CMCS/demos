import React from "react";

import {
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import {
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DemoData from "faker_data/demonstrations.json";
import { DemonstrationTable } from "../Table";

const mydemos = DemoData.filter(d => d.userId === 139);

const mockRawData = [
  {
    id: 1,
    title: "Medicaid Montana Expenditure Cap Demonstration",
    demoNumber: "MT-1-2019-05-10",
    description: "...",
    evalPeriodStartDate: "2019-05-10",
    evalPeriodEndDate: "2024-05-10",
    demonstrationStatusId: 3,
    userId: 139,
    stateId: "MT",
    projectOfficer: "Qui-Gon Jinn",
    createdAt: "...",
    updatedAt: "...",
  },
  {
    id: 2,
    title: "Medicaid Florida Reproductive Health: Fertility Demonstration",
    demoNumber: "FL-2-2018-07-08",
    description: "...",
    evalPeriodStartDate: "2018-07-08",
    evalPeriodEndDate: "2023-07-08",
    demonstrationStatusId: 4,
    userId: 195,
    stateId: "FL",
    projectOfficer: "Obiwan Kenobi",
    createdAt: "...",
    updatedAt: "...",
  },
  {
    id: 3,
    title: "Medicaid Alaska Delivery System Reform Incentive Payment (DSRIP) Demonstration",
    demoNumber: "AK-3-2018-06-27",
    description: "...",
    evalPeriodStartDate: "2018-06-27",
    evalPeriodEndDate: "2023-06-27",
    demonstrationStatusId: 3,
    userId: 121,
    stateId: "AK",
    projectOfficer: "Ezra Bridger",
    createdAt: "...",
    updatedAt: "...",
  },
];

describe("DemonstrationTable", () => {
  beforeEach(() => {
    render(<DemonstrationTable data={mockRawData} />);
  });

  it("renders the filter dropdown without `expander` or `select` options", () => {
    const filterSelect = screen.getByLabelText(/filter by:/i);

    const options = Array.from(
      filterSelect.querySelectorAll("option")
    ).map((opt) => opt.textContent);

    expect(options).not.toContain("expander");
    expect(options).not.toContain("select");
    expect(options).toContain("State/Territory");
    expect(options).toContain("Number");
    expect(options).toContain("Title");
    expect(options).toContain("Project Officer");
  });

  it("renders all demonstration titles initially", () => {
    expect(
      screen.getByText("Medicaid Montana Expenditure Cap Demonstration")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Medicaid Florida Reproductive Health: Fertility Demonstration")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Medicaid Alaska Delivery System Reform Incentive Payment (DSRIP) Demonstration")
    ).toBeInTheDocument();
  });

  it("filters rows correctly when using the dropdown and typing a filter value", async () => {
    const user = userEvent.setup();

    const filterSelect = screen.getByLabelText(/filter by:/i);
    await user.selectOptions(filterSelect, ["stateId"]);

    const filterInput = screen.getByPlaceholderText(/type to filter/i);
    await user.type(filterInput, "FL");

    expect(
      screen.getByText("Medicaid Florida Reproductive Health: Fertility Demonstration")
    ).toBeInTheDocument();

    expect(
      screen.queryByText("Medicaid Montana Expenditure Cap Demonstration")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByText("Medicaid Alaska Delivery System Reform Incentive Payment (DSRIP) Demonstration")
    ).not.toBeInTheDocument();
  });

  it("renders the empty state message if there is no data", () => {
    render(<DemonstrationTable data={mydemos} isMyDemosTable={true} />);
    expect(
      screen.getByText(/you have no assigned demonstrations at this time/i)
    ).toBeInTheDocument();
  });

  it("renders the empty state message for all demonstrations when there is no data", () => {
    render(<DemonstrationTable data={[]} isMyDemosTable={false} />);
    expect(
      screen.getByText(/no demonstrations are tracked/i)
    ).toBeInTheDocument();
  });

  it("renders the 'no results found' message for all demonstrations", async () => {
    const user = userEvent.setup();

    render(<DemonstrationTable data={mockRawData} isMyDemosTable={false} />);

    const filterSelect = screen.getByLabelText(/filter by:/i);
    await user.selectOptions(filterSelect, ["title"]);

    const filterInput = screen.getByPlaceholderText(/type to filter/i);
    await user.type(filterInput, "ZZZZZZZ");

    expect(
      await screen.findByText((content) =>
        content.includes("No results were returned. Adjust your search and filter criteria.")
      )
    ).toBeInTheDocument();
  });
});
