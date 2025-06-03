import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, beforeEach, afterEach, expect, it } from "vitest";
import { DebugOnly } from "./DebugOnly";

describe("DebugOnly", () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("renders children when NODE_ENV is 'development'", () => {
    process.env.NODE_ENV = "development";
    render(
      <DebugOnly>
        <span>Debug Content</span>
      </DebugOnly>
    );
    expect(screen.getByText("Debug Content")).toBeInTheDocument();
  });

  it("renders nothing when NODE_ENV is not 'development'", () => {
    process.env.NODE_ENV = "production";
    const { container } = render(
      <DebugOnly>
        <span>Debug Content</span>
      </DebugOnly>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when NODE_ENV is undefined", () => {
    process.env.NODE_ENV = undefined;
    const { container } = render(
      <DebugOnly>
        <span>Debug Content</span>
      </DebugOnly>
    );
    expect(container).toBeEmptyDOMElement();
  });
});
