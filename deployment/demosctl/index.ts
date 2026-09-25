#!/usr/bin/env tsx
/* eslint-disable @typescript-eslint/no-floating-promises */
import { main } from "./demosctl";

(async () => {
  process.exit(await main());
})();
