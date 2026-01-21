import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SelectDemonstrationTypes } from "./SelectDemonstrationTypes";
import { SelectTag } from "./SelectTag";

vi.mock("./SelectTag", () => ({
  SelectTag: vi.fn(() => <div data-testid="mock-select-tag">Mocked SelectTag</div>),
}));

describe("SelectDemonstrationTypeTag", () => {
  const mockOnSelect = vi.fn();
  const MockSelectTag = vi.mocked(SelectTag);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders SelectTag with correct label", () => {
    render(<SelectDemonstrationTypes value="" onSelect={mockOnSelect} />);

    const props = MockSelectTag.mock.calls[0][0];
    expect(props.label).toBe("Demonstration Type");
  });

  it("passes value prop to SelectTag", () => {
    render(<SelectDemonstrationTypes value="Type A" onSelect={mockOnSelect} />);

    const props = MockSelectTag.mock.calls[0][0];
    expect(props.value).toBe("Type A");
  });

  it("passes onSelect prop to SelectTag", () => {
    render(<SelectDemonstrationTypes value="" onSelect={mockOnSelect} />);

    const props = MockSelectTag.mock.calls[0][0];
    expect(props.onSelect).toBe(mockOnSelect);
  });

  it("passes isRequired prop to SelectTag when provided", () => {
    render(<SelectDemonstrationTypes value="" onSelect={mockOnSelect} isRequired />);

    const props = MockSelectTag.mock.calls[0][0];
    expect(props.isRequired).toBe(true);
  });

  it("does not pass isRequired when not provided", () => {
    render(<SelectDemonstrationTypes value="" onSelect={mockOnSelect} />);

    const props = MockSelectTag.mock.calls[0][0];
    expect(props.isRequired).toBeUndefined();
  });

  it("passes filter prop to SelectTag when provided", () => {
    const filterFn = (type: string) => type !== "Type B";
    render(<SelectDemonstrationTypes value="" onSelect={mockOnSelect} filter={filterFn} />);

    const props = MockSelectTag.mock.calls[0][0];
    expect(props.filter).toBe(filterFn);
  });

  // TODO: this will need to be further fleshed out when real data fetching is implemented
  it("provides a useTagQuery hook as a function", () => {
    render(<SelectDemonstrationTypes value="" onSelect={mockOnSelect} />);

    const props = MockSelectTag.mock.calls[0][0];
    expect(props.useTagQuery).toBeInstanceOf(Function);
  });

  it("useTagQuery returns transformed data with tags array", () => {
    render(<SelectDemonstrationTypes value="" onSelect={mockOnSelect} />);

    const props = MockSelectTag.mock.calls[0][0];
    const useTagQuery = props.useTagQuery;

    // Create a test component to call the hook
    const TestComponent = () => {
      const result = useTagQuery();
      return <div data-testid="result">{JSON.stringify(result)}</div>;
    };

    const { getByTestId } = render(<TestComponent />);
    const result = JSON.parse(getByTestId("result").textContent || "{}");

    expect(result).toEqual({
      data: {
        tags: ["Type A", "Type B", "Type C", "Type D"],
      },
      loading: false,
      error: undefined,
    });
  });

  it("useTagQuery transforms demonstrationTypeTags to tags", () => {
    render(<SelectDemonstrationTypes value="" onSelect={mockOnSelect} />);

    const props = MockSelectTag.mock.calls[0][0];
    const useTagQuery = props.useTagQuery;

    // Create a test component to call the hook
    const TestComponent = () => {
      const result = useTagQuery();
      return <div data-testid="result">{JSON.stringify(result)}</div>;
    };

    const { getByTestId } = render(<TestComponent />);
    const result = JSON.parse(getByTestId("result").textContent || "{}");

    // Verify transformation: demonstrationTypeTags -> tags
    expect(result.data).toHaveProperty("tags");
    expect(result.data?.tags).toEqual(["Type A", "Type B", "Type C", "Type D"]);
    expect(result.data).not.toHaveProperty("demonstrationTypeTags");
  });
});
