import React from "react";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";
import { describe, it, expect } from "vitest";
import { TestProvider } from "test-utils/TestProvider";

describe("Footer Component", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <TestProvider>
        <Footer />
      </TestProvider>
    );
    expect(container).toBeInTheDocument();
  });

  it("displays the hhs logo", () => {
    render(
      <TestProvider>
        <Footer />
      </TestProvider>
    );
    expect(screen.getByTestId("hhs-logo")).toBeInTheDocument();
  });

  it("displays the footer links", () => {
    render(
      <TestProvider>
        <Footer />
      </TestProvider>
    );
    expect(screen.getByText(/References/i)).toBeInTheDocument();
    expect(screen.getByText(/Contact Us/i)).toBeInTheDocument();
    expect(screen.getByText(/FAQ/i)).toBeInTheDocument();
  });

  it("displays the main logo", () => {
    render(
      <TestProvider>
        <Footer />
      </TestProvider>
    );
    expect(screen.getByTestId("demos-logo-simplified")).toBeInTheDocument();
  });
  it("displays the version", () => {
    render(
      <TestProvider>
        <Footer />
      </TestProvider>
    );
    expect(screen.getByText(/DEMOS version/i)).toBeInTheDocument();
  });
  it("displays the address", () => {
    render(
      <TestProvider>
        <Footer />
      </TestProvider>
    );
    expect(screen.getByText(/7500 Security Boulevard Baltimore, MD 21244/i)).toBeInTheDocument();
  });
});
