import {
  Demonstration as PrismaDemonstration,
  Amendment as PrismaAmendment,
  Extension as PrismaExtension,
} from "@prisma/client";

export type PrismaApplication = PrismaDemonstration | PrismaAmendment | PrismaExtension;

export type FindApplicationQueryResult = {
  id: string;
  applicationTypeId: string;
  demonstration: PrismaDemonstration | null;
  amendment: PrismaAmendment | null;
  extension: PrismaExtension | null;
};
