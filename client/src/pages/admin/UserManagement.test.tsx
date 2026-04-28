import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UserManagement } from "./UserManagement";

describe("UserManagement", () => {
  it("renders without crashing", () => {
    render(<UserManagement />);
    expect(screen.getByText("User Management")).toBeInTheDocument();
  });
});
