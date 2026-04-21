# demos_shared_library

This folder contains a small TypeScript shared library used by other packages in the monorepo.

Quick start

1. Install dev dependencies:

```bash
cd shared_library
npm ci
```

2. Build:

```bash
npm run build
```

3. Use the built output from `dist/` (exports are ESM and type declarations are included).

## Important ideas for the BN Workbook code
The BN Workbook code is contained in the BN folder.

In the BN/index.ts file there is a function, parseBNFile(), that takes a Blob and returns the ExcelData object that the validations use. There is also parseBNFileFromPath, which can do the same directly from the file system.

In the BN/validation.ts file there is a function: `async function validateBNWorkbook(data: ExcelData, validations: ValidationFunction[]): Promise<ValidationError[]>`. This function takes the parsed ExcelData and an array of validation functions, and returns an array of ValidationErrors. If there are no errors, the array is empty.

Currently we only have one set of implemented validation rules, located in BN/rulesets/v1/index.ts.

The documentation for the validation rules is located at shared_library/validation_rules.xlsx, and a blank workbook is located at shared_library/test/fixtures/v1_empty.xlsm.

## Load A BN Workbook And Run Validations from command line

1. Build the package first:

```bash
cd shared_library
npm run build
```

2. Create a script file, for example `scripts/run-bn-validations.mjs`, with the following:

```js
import { parseBNFileFromPath } from "../dist/BN/index.js";
import { validateBNWorkbook } from "../dist/BN/validation.js";
import { validations as v1Validations } from "../dist/BN/rulesets/v1/index.js";

const workbookPath = process.argv[2];

if (!workbookPath) {
	console.error("Usage: node scripts/run-bn-validations.mjs <path-to-workbook>");
	process.exit(1);
}

const workbookData = await parseBNFileFromPath(workbookPath);
const errors = await validateBNWorkbook(workbookData, v1Validations);

if (errors.length === 0) {
	console.log("No validation errors found.");
} else {
	console.log(`Found ${errors.length} validation error(s):`);
	for (const error of errors) {
		console.log(`- [${error.code}] ${error.message}`);
	}
}
```

3. Run the script and pass the workbook path:

```bash
node scripts/run-bn-validations.mjs ./path/to/workbook.xlsm
```

## Notes for the client:
The shared library functions can be run in a Web Worker. For the Blob source, you can use the files array on the file input DOM element:
```js
// Step 1: Initialize Web Worker.

const worker = new Worker('web-worker.js')

worker.onmessage = function(event) {
  // `event.data` is the validation errors.
  console.log(event.data)
}

worker.onerror = function(event) {
  console.error(event.message)
}

// Step 2: User chooses a file and the application sends it to the Web Worker.

const input = document.getElementById('input')

input.addEventListener('change', () => {
  worker.postMessage(input.files[0])
})
```

web-worker.js:

```js
import { parseBNFile } from "../dist/BN/index.js";
import { validateBNWorkbook } from "../dist/BN/validation.js";
import { validations as v1Validations } from "../dist/BN/rulesets/v1/index.js";

onmessage = async function(event) {
    const workbookData = await parseBNFile(event.data);
    const errors = await validateBNWorkbook(workbookData, v1Validations);
    postMessage(errors)
}
```