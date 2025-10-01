import { generateCustomSetScalar } from "../../resolverFunctions.js";
import { SIGNATURE_LEVEL } from "../../constants.js";

export const signatureLevelResolvers = {
  SignatureLevel: generateCustomSetScalar(
    SIGNATURE_LEVEL,
    "SignatureLevel",
    "A string representing a signature level."
  ),
};
