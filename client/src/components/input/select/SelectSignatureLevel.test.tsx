import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectSignatureLevel } from "./SelectSignatureLevel";
import { SIGNATURE_LEVEL } from "demos-server-constants";
import { getSelectOptionLabels, selectOption } from "test-utils/select";

const onSelect = vi.fn();

describe("SelectSignatureLevel", () => {
  it("renders all signature level options with explicit labels", async () => {
    const user = userEvent.setup();
    render(<SelectSignatureLevel onSelect={onSelect} />);
    const optionLabels = await getSelectOptionLabels(user, screen.getByLabelText("Signature Level"));
    expect(optionLabels).toContain("OA - Office of the Administrator");
    expect(optionLabels).toContain("OCD - Office of the Center Director");
    expect(optionLabels).toContain("OGD - Office of the Group Director");
  });

  it("calls onSelect when an option is selected", async () => {
    const user = userEvent.setup();
    render(<SelectSignatureLevel onSelect={onSelect} />);
    const select = screen.getByLabelText("Signature Level");
    await selectOption(user, select, SIGNATURE_LEVEL[0]);
    expect(select).toHaveTextContent("OA - Office of the Administrator");
    expect(onSelect).toHaveBeenCalledWith(SIGNATURE_LEVEL[0]);
  });

  it("renders only allowed signature level options", async () => {
    const user = userEvent.setup();
    render(
      <SelectSignatureLevel
        onSelect={onSelect}
        allowedSignatureLevels={["OA", "OCD"]}
      />
    );
    const optionLabels = await getSelectOptionLabels(user, screen.getByLabelText("Signature Level"));
    expect(optionLabels).toContain("OA - Office of the Administrator");
    expect(optionLabels).toContain("OCD - Office of the Center Director");
    expect(optionLabels).not.toContain("OGD - Office of the Group Director");
  });
});
