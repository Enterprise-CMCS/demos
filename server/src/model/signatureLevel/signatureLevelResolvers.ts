import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import {
  AMENDMENT_SIGNATURE_LEVELS,
  EXTENSION_SIGNATURE_LEVELS,
  SIGNATURE_LEVEL,
} from "../../constants.js";

export const signatureLevelResolvers = {
  SignatureLevel: generateCustomSetScalar(
    SIGNATURE_LEVEL,
    "SignatureLevel",
    "A string representing a signature level."
  ),
  AmendmentSignatureLevel: generateCustomSetScalar(
    AMENDMENT_SIGNATURE_LEVELS,
    "AmendmentSignatureLevel",
    "A string representing a signature level for an amendment."
  ),
  ExtensionSignatureLevel: generateCustomSetScalar(
    EXTENSION_SIGNATURE_LEVELS,
    "ExtensionSignatureLevel",
    "A string representing a signature level for an extension."
  ),
};
