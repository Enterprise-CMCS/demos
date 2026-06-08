import React from "react";
import { render, screen } from "@testing-library/react";
import { UserAuthenticationFailed } from "./UserAuthenticationFailed";
import { CONTACT_US_MAILTO } from "components/footer/Footer";

describe("UserAuthenticationFailed", () => {
  it("shows the authentication failed notice", () => {
    render(<UserAuthenticationFailed />);
    expect(screen.getByText("Authentication Failed")).toBeInTheDocument();
  });

  it("shows name and email when both provided", () => {
    render(<UserAuthenticationFailed name="Jane Doe" email="jane@example.com" />);
    expect(screen.getByText(/Signed in as Jane Doe \(jane@example\.com\)/)).toBeInTheDocument();
  });

  it("shows name only when email is omitted", () => {
    render(<UserAuthenticationFailed name="Jane Doe" />);
    expect(screen.getByText(/Signed in as Jane Doe/)).toBeInTheDocument();
    expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
  });

  it("shows email only when name is omitted", () => {
    render(<UserAuthenticationFailed email="jane@example.com" />);
    expect(screen.getByText(/Signed in as \(jane@example\.com\)/)).toBeInTheDocument();
  });

  it("omits identity line when neither name nor email provided", () => {
    render(<UserAuthenticationFailed />);
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  });

  it("shows error message when provided", () => {
    render(<UserAuthenticationFailed errorMessage="Network request failed" />);
    expect(screen.getByText(/Error: Network request failed/)).toBeInTheDocument();
  });

  it("omits error message when not provided", () => {
    render(<UserAuthenticationFailed />);
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  it("contact support link points to the support email", () => {
    render(<UserAuthenticationFailed />);
    expect(screen.getByText("Contact support")).toHaveAttribute("href", CONTACT_US_MAILTO);
  });
});
