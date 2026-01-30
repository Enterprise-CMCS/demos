import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
} from "@prisma/client";

export type PrismaApplication = PrismaDemonstration | PrismaAmendment | PrismaExtension;
