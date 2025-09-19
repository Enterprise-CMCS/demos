#!/usr/bin/env tsx
import { main } from "./demosctl";

(async () => {
  process.exit(await main());
})();
