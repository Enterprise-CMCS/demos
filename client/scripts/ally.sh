#!/usr/bin/env bash
set -e

# @axe-core/cli is run via npx to avoid a global install.
# It was removed from devDependencies due to security findings in axe-core.

CI=${CI:-false}

echo "Installing browser driver..."
npx browser-driver-manager install chrome

if [ "$CI" = "true" ]; then
  npx @axe-core/cli http://localhost:3000 \
    --save accessibility-report.json \
    --exit \
    --no-reporter
else
  echo "Running accessibility check..."
  echo "Make sure dev server is running (npm run dev)"
  npx @axe-core/cli http://localhost:3000 \
    --save accessibility-report.json \
    --verbose \
    --timer \
    --tags wcag2a,wcag2aa,wcag21aa
  echo "Accessibility report saved to accessibility-report.json"
fi
