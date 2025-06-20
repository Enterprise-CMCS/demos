import { spawn } from "child_process";
import * as fs from "fs";
import path from "path";
import chalk from "chalk";

const colorOpts = {
  bgBlue: false,
  bgGreen: false,
  bgYellow: false,
  bgRed: false,
  bgMagenta: false,
  bgCyan: false,
  bgWhite: false,
  black: false,
  red: false,
  green: false,
  yellow: false,
  blue: false,
  magenta: false,
  cyan: false,
  white: false,
};

function reserveRandomColor() {
  const colors = Object.keys(colorOpts).filter((key) => !colorOpts[key]);
  if (colors.length === 0) {
    return null;
  }
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  colorOpts[randomColor] = true;
  return randomColor;
}

function runCommand(name, cmd, args, opts) {
  const child = spawn(cmd, args, opts);
  const color = reserveRandomColor();
  const nameC = chalk[color](`[${name}]`);

  child.stdout.on("data", (data) => {
    process.stdout.write(`${nameC} ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stdout.write(`${nameC} ${data}`);
  });
  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      process.stderr.write(`child process error: ${error}`);
      colorOpts[color] = false;
      reject(error);
    });

    child.on("close", (code) => {
      process.stdout.write(`${cmd} exited with code ${code}`);
      colorOpts[color] = false;
      resolve(code);
    });
  });
}

function runShell(name, sh, opts) {
  const child = spawn(sh, { ...opts, shell: true });
  const color = reserveRandomColor();
  const nameC = chalk[color](`[${name}]`);
  child.stdout.on("data", (data) => {
    process.stdout.write(`${nameC} ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stdout.write(`${nameC} ${data}`);
  });
  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      process.stderr.write(`child process error: ${error}`);
      colorOpts[color] = false;
      reject(error);
    });

    child.on("close", (code) => {
      process.stdout.write(`${sh} exited with code ${code}`);
      colorOpts[color] = false;
      resolve(code);
    });
  });
}

async function main() {
  const coreOutputCmd = await runCommand("core-deploy", "cdk", [
    "deploy",
    "--context",
    "stage=dev",
    "demos-dev-core",
    "--outputs-file",
    "core-outputs.json",
  ]);

  if (coreOutputCmd != 0) {
    process.stderr.write(
      `core output command failed with code ${coreOutputCmd}`
    );
    process.exit(coreOutputCmd);
  }

  const coreOutputs = fs.readFileSync("core-outputs.json", "utf8");
  const coreOutputData = JSON.parse(coreOutputs);

  const clientPath = path.join("..", "client");

  const uiBuildCmd = runShell(
    "ui-build",
    "source ~/.nvm/nvm.sh && nvm use && npm ci && npm run build",
    {
      cwd: clientPath,
      env: {
        VITE_COGNITO_AUTHORITY:
          coreOutputData["demos-dev-core"].cognitoAuthority,
        VITE_COGNITO_DOMAIN: coreOutputData["demos-dev-core"].cognitoDomain,
        VITE_COGNITO_CLIENT_ID:
          coreOutputData["demos-dev-core"].cognitoClientId,
        VITE_BASE_URL: coreOutputData["demos-dev-core"].baseUrl,
        VITE_API_URL_PREFIX: "/api/graphql",
      },
    }
  );

  const serverPath = path.join("..", "server");
  const serverBuildCmd = runShell(
    "server-build",
    "source ~/.nvm/nvm.sh && nvm use && npm ci && npm run build:ci",
    {
      cwd: serverPath,
    }
  );

  const uiBuildResult = await uiBuildCmd;
  const serverBuildResult = await serverBuildCmd;

  if (uiBuildResult != 0) {
    process.stderr.write(`ui build command failed with code ${uiBuildResult}`);
    process.exit(uiBuildResult);
  }

  if (serverBuildResult != 0) {
    process.stderr.write(
      `server build command failed with code ${serverBuildResult}`
    );
    process.exit(serverBuildResult);
  }

  const completeDeployCmd = await runCommand("deploy-all", "cdk", [
    "deploy",
    "--context",
    "stage=dev",
    "--all",
    "--no-change-set",
  ]);

  if (completeDeployCmd != 0) {
    process.stderr.write(
      `complete deploy command failed with code ${completeDeployCmd}`
    );
    process.exit(completeDeployCmd);
  }

  process.stdout.write(`complete deploy command succeeded`);
}

main();
