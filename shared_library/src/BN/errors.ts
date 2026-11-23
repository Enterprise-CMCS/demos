import type { ValidationError } from "./validation.js";

export class BNWorkbookInputError extends Error {
  constructor(readonly validationError: ValidationError) {
    super(validationError.message);
    this.name = "BNWorkbookInputError";
  }
}