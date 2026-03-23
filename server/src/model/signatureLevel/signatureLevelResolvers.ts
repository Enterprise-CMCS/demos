import { generateCustomSetScalar } from "../../customScalarResolvers.js";
import { SIGNATURE_LEVEL } from "../../constants.js";
import { Amendment, Demonstration, Extension, Prisma } from "@prisma/client";
import { GraphQLContext } from "../../auth/auth.util.js";
import { GraphQLResolveInfo } from "graphql";

export const signatureLevelResolvers = {
  SignatureLevel: generateCustomSetScalar(
    SIGNATURE_LEVEL,
    "SignatureLevel",
    "A string representing a signature level."
  ),
};
