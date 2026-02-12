describe("checkFormHasChanges", () => {
  it("returns false when name and description are empty", () => {});

  it("returns true when name is filled", () => {});

  it("returns true when description is filled", () => {});

  it("ignores demonstrationId and stateId", () => {});
});

describe("BaseCreateModificationDialog", () => {
  describe("Rendering and UI", () => {
    it("renders with correct title for Amendment", () => {});

    it("renders with correct title for Extension", () => {});

    it("renders all required form fields", () => {});

    it("renders correct form ID based on modification type", () => {});

    it("renders action buttons", () => {});
  });

  describe("Context-Aware Behavior", () => {
    describe("When creating from landing page (no initialDemonstrationId)", () => {
      it("enables demonstration selection", () => {});

      it("keeps state field disabled until demonstration is selected", async () => {});

      it("loads demonstration data when demonstration is selected", async () => {});
    });

    describe("When creating from demonstration context (initialDemonstrationId provided)", () => {
      it("disables demonstration selection", () => {});

      it("pre-selects the demonstration", () => {});

      it("automatically loads and populates state from demonstration", async () => {});
    });
  });

  describe("Form Validation", () => {
    it("disables submit button when demonstration is not selected", () => {});

    it("disables submit button when title is empty", async () => {});

    it("enables submit button when all required fields are filled", async () => {});
  });

  describe("Form Interactions", () => {
    it("updates title field value on change", () => {});

    it("updates description field value on change", () => {});

    it("shows cancel confirmation when cancel button is clicked", () => {});
  });

  describe("Submission Handling", () => {
    it("displays loading state during submission", async () => {});

    it("shows error toast and closes dialog on query error", async () => {});
  });

  describe("Works for both Amendments and Extensions", () => {
    it("applies correct labels and placeholders for Extensions", () => {});

    it("uses correct button names for Extensions", () => {});
  });
});
