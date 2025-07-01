import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeaderConfigProvider, useHeaderConfig } from "./HeaderConfigContext";

const TestConsumer = () => {
  const { setHeaderConfig } = useHeaderConfig();

  return (
    <>
      <button onClick={() => setHeaderConfig({ lowerContent: <div>Updated Content</div> })}>
        Update Header
      </button>
    </>
  );
};

describe("HeaderConfigProvider", () => {
  it("renders defaultLowerContent initially", () => {
    render(
      <HeaderConfigProvider defaultLowerContent={<div>Default Content</div>}>
        <TestConsumer />
      </HeaderConfigProvider>
    );
    expect(screen.getByText("Default Content")).toBeInTheDocument();
  });

  it("updates content when setHeaderConfig is called", async () => {
    const user = userEvent.setup();
    render(
      <HeaderConfigProvider defaultLowerContent={<div>Default Content</div>}>
        <TestConsumer />
      </HeaderConfigProvider>
    );

    expect(screen.getByText("Default Content")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Update Header/i }));

    expect(screen.getByText("Updated Content")).toBeInTheDocument();
  });
});
