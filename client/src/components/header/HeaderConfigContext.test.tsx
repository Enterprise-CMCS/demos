import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserProvider } from "components/user/UserContext";
import { HeaderConfigProvider, useHeaderConfig } from "./HeaderConfigContext";
import { Header } from "./Header";
import { DemosApolloProvider } from "router/DemosApolloProvider";

const TestConsumer = () => {
  const { setHeaderConfig } = useHeaderConfig();
  return (
    <button
      onClick={() =>
        setHeaderConfig({ lowerContent: <div data-testid="updated">Updated Content</div> })
      }
    >
      Update Header
    </button>
  );
};

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <DemosApolloProvider>
      <UserProvider>{ui}</UserProvider>
    </DemosApolloProvider>
  );
}

describe("HeaderConfigProvider", () => {
  it("renders defaultLowerContent initially inside Header", () => {
    renderWithProviders(
      <HeaderConfigProvider defaultLowerContent={<div data-testid="default">Default Content</div>}>
        <Header />
      </HeaderConfigProvider>
    );
    expect(screen.getByTestId("default")).toHaveTextContent("Default Content");
  });

  it("updates content in Header when setHeaderConfig is called", async () => {
    const user = userEvent.setup();

    renderWithProviders(
      <HeaderConfigProvider defaultLowerContent={<div data-testid="default">Default Content</div>}>
        <Header />
        <TestConsumer />
      </HeaderConfigProvider>
    );

    expect(screen.getByTestId("default")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Update Header/i }));

    expect(screen.getByTestId("updated")).toHaveTextContent("Updated Content");
    expect(screen.queryByTestId("default")).not.toBeInTheDocument();
  });
});
