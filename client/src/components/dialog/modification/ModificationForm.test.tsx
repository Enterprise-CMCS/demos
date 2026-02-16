import React from "react";
import { vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModificationForm, ModificationFormData } from "./ModificationForm";
import userEvent from "@testing-library/user-event";
import { LocalDate } from "demos-server";

vi.mock("components/input/select/SelectDemonstration", () => ({
  SelectDemonstration: ({
    onSelect,
    value,
    isRequired,
  }: {
    isRequired?: boolean;
    onSelect: (id: string) => void;
    value: string;
  }) => (
    <select
      data-testid="select-demonstration"
      value={value}
      onChange={(e) => onSelect(e.target.value)}
      required={isRequired}
    >
      <option value="">Select demonstration</option>
      <option value="demo-1">Demo 1</option>
      <option value="demo-2">Demo 2</option>
    </select>
  ),
}));

const mockModificationFormData: ModificationFormData = {
  demonstrationId: "",
  name: "",
  description: "",
  signatureLevel: undefined,
};

describe("ModificationForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSetModificationFormDataField = vi.fn();

  it("renders form with correct modification name for Amendment", async () => {
    render(
      <ModificationForm
        mode="create"
        modificationFormData={mockModificationFormData}
        setModificationFormDataField={mockSetModificationFormDataField}
        modificationType="Amendment"
      />
    );

    expect(screen.getByText("Amendment Title")).toBeInTheDocument();
    expect(screen.getByText("Amendment Description")).toBeInTheDocument();
    expect(screen.getByText("Signature Level")).toBeInTheDocument();
  });

  it("renders form with correct modification name for Extension", async () => {
    render(
      <ModificationForm
        mode="create"
        modificationFormData={mockModificationFormData}
        setModificationFormDataField={mockSetModificationFormDataField}
        modificationType="Extension"
      />
    );

    expect(screen.getByText("Extension Title")).toBeInTheDocument();
    expect(screen.getByText("Extension Description")).toBeInTheDocument();
    expect(screen.getByText("Signature Level")).toBeInTheDocument();
  });

  it("includes demonstration select when showDemonstrationSelect is true", async () => {
    render(
      <ModificationForm
        mode="create"
        modificationFormData={mockModificationFormData}
        setModificationFormDataField={mockSetModificationFormDataField}
        showDemonstrationSelect={true}
        modificationType="Amendment"
      />
    );

    expect(screen.getByTestId("select-demonstration")).toBeInTheDocument();
  });

  it("omits demonstration select when showDemonstrationSelect is false", async () => {
    render(
      <ModificationForm
        mode="create"
        modificationFormData={mockModificationFormData}
        setModificationFormDataField={mockSetModificationFormDataField}
        showDemonstrationSelect={false}
        modificationType="Amendment"
      />
    );

    expect(screen.queryByTestId("select-demonstration")).not.toBeInTheDocument();
  });

  it("renders with initial form data values", async () => {
    const populatedFormData: ModificationFormData = {
      demonstrationId: "demo-1",
      name: "Initial Name",
      description: "Initial Description",
      signatureLevel: "OA",
    };
    render(
      <ModificationForm
        mode="create"
        modificationFormData={populatedFormData}
        setModificationFormDataField={mockSetModificationFormDataField}
        showDemonstrationSelect={true}
        modificationType="Extension"
      />
    );

    expect(screen.getByTestId("select-demonstration")).toHaveValue("demo-1");
    expect(screen.getByLabelText(/Extension Title/)).toHaveValue("Initial Name");
    expect(screen.getByLabelText(/Extension Description/)).toHaveValue("Initial Description");
    expect(screen.getByLabelText(/Signature Level/)).toHaveValue("OA");
  });

  it("calls setModificationFormDataField when fields change", async () => {
    const user = userEvent.setup();
    const emptyFormData: ModificationFormData = {
      demonstrationId: "",
      name: "",
      description: "",
      signatureLevel: undefined,
    };

    render(
      <ModificationForm
        mode="create"
        modificationFormData={emptyFormData}
        setModificationFormDataField={mockSetModificationFormDataField}
        showDemonstrationSelect={true}
        modificationType="Amendment"
      />
    );

    // Verify name field onChange is wired up
    await user.type(screen.getByLabelText(/Amendment Title/), "A");
    expect(mockSetModificationFormDataField).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.any(String) })
    );

    mockSetModificationFormDataField.mockClear();
    await user.type(screen.getByLabelText(/Amendment Description/), "B");
    expect(mockSetModificationFormDataField).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.any(String) })
    );

    mockSetModificationFormDataField.mockClear();
    await user.selectOptions(screen.getByTestId("select-demonstration"), "demo-2");
    expect(mockSetModificationFormDataField).toHaveBeenCalledWith(
      expect.objectContaining({ demonstrationId: "demo-2" })
    );

    mockSetModificationFormDataField.mockClear();
    await user.selectOptions(screen.getByLabelText(/Signature Level/), "OCD");
    expect(mockSetModificationFormDataField).toHaveBeenCalledWith(
      expect.objectContaining({ signatureLevel: "OCD" })
    );
  });

  it("marks required fields with isRequired prop", async () => {
    render(
      <ModificationForm
        mode="create"
        modificationFormData={mockModificationFormData}
        setModificationFormDataField={mockSetModificationFormDataField}
        showDemonstrationSelect={true}
        modificationType="Amendment"
      />
    );

    expect(screen.getByLabelText(/Amendment Title/)).toBeRequired();
    expect(screen.getByTestId("select-demonstration")).toBeRequired();
  });

  describe("Edit Mode", () => {
    it("shows effective date field in edit mode", () => {
      render(
        <ModificationForm
          mode="edit"
          modificationFormData={mockModificationFormData}
          setModificationFormDataField={mockSetModificationFormDataField}
          modificationType="Amendment"
        />
      );

      expect(screen.getByLabelText(/Effective Date/)).toBeInTheDocument();
    });

    it("hides effective date field in create mode", () => {
      render(
        <ModificationForm
          mode="create"
          modificationFormData={mockModificationFormData}
          setModificationFormDataField={mockSetModificationFormDataField}
          modificationType="Amendment"
        />
      );

      expect(screen.queryByLabelText(/Effective Date/)).not.toBeInTheDocument();
    });

    it("renders with initial effective date value in edit mode", () => {
      const populatedFormData: ModificationFormData = {
        demonstrationId: "demo-1",
        name: "Initial Name",
        description: "Initial Description",
        signatureLevel: "OA",
        effectiveDate: "2024-01-15" as LocalDate,
      };

      render(
        <ModificationForm
          mode="edit"
          modificationFormData={populatedFormData}
          setModificationFormDataField={mockSetModificationFormDataField}
          modificationType="Extension"
        />
      );

      expect(screen.getByLabelText(/Effective Date/)).toHaveValue("2024-01-15");
    });

    it("calls setModificationFormDataField when effective date changes", async () => {
      const user = userEvent.setup();
      const formData: ModificationFormData = {
        demonstrationId: "demo-1",
        name: "Test",
        description: "",
        signatureLevel: undefined,
      };

      render(
        <ModificationForm
          mode="edit"
          modificationFormData={formData}
          setModificationFormDataField={mockSetModificationFormDataField}
          modificationType="Amendment"
        />
      );

      const effectiveDateInput = screen.getByLabelText(/Effective Date/);
      await user.clear(effectiveDateInput);
      await user.type(effectiveDateInput, "2024-02-20");

      expect(mockSetModificationFormDataField).toHaveBeenCalledWith(
        expect.objectContaining({ effectiveDate: expect.any(String) })
      );
    });
  });
});
