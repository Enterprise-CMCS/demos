# DEMOS Client

The **DEMOS Client** is the frontend application for the Demonstration Evaluation & Management Oversight System. It’s built with React, Vite, TypeScript, and Tailwind CSS. This README explains how to get up and running in a local development environment—either directly via npm (macOS/Windows) or using VS Code Dev Containers.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Setup via npm (macOS/Windows)](#local-setup-via-npm)

   * [1. Clone the Repository](#1-clone-the-repository)
   * [2. Install Dependencies](#2-install-dependencies)
   * [3. Environment Variables (if applicable)](#3-environment-variables)
   * [4. Start the Dev Server](#4-start-the-dev-server)
3. [Using VS Code Dev Containers](#using-vs-code-dev-containers)

   * [1. Install Docker](#1-install-docker)
   * [2. Install VS Code & Extensions](#2-install-vs-code--extensions)
   * [3. Open Folder in Container](#3-open-folder-in-container)
   * [4. Container Rebuild & Start](#4-container-rebuild--start)
4. [Available npm Scripts](#available-npm-scripts)
5. [Linting & Testing](#linting--testing)
6. [Building for Production](#building-for-production)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

* **Node.js & npm**

  * Recommended Node.js LTS (≥ 18.x).
  * npm (included with Node.js).
* **Git**

  * For cloning and version control.
* **(Optional) Docker & VS Code**

  * If you choose to use Dev Containers.
  * VS Code Remote – Containers extension.

---

## Local Setup via npm

Follow these steps to run the client locally on macOS or Windows without containers.

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/demos-client.git
cd demos-client
```

### 2. Install Dependencies

From the project root, run:

```bash
npm install
```

This pulls in all dependencies listed under `devDependencies` and `dependencies` in `package.json`.

### 3. Environment Variables (if applicable)

If your local environment requires custom API endpoints or secrets, create a `.env` file in the root directory. For example:

```bash
cp .env.example .env
# Edit .env and provide any required variables, e.g.:
# VITE_API_URL=http://localhost:4000/graphql
```

> *Note:* This repository does not include a default `.env.example`. Add any frontend-specific environment variables as needed.

### 4. Start the Dev Server

Run the Vite dev server:

```bash
npm run dev
```

By default, Vite will:

* Host on `localhost` (or `0.0.0.0` if you’re on a networked machine).
* Output a local URL (e.g., `http://localhost:5173`).

Point your browser there to see the live-reloading client.

---

## Using VS Code Dev Containers

If you prefer an isolated, reproducible environment, use VS Code Dev Containers. This is helpful when onboarding or ensuring everyone has the same Node version and tooling.

### 1. Install Docker

* Download and install Docker Desktop:

  * [macOS](https://www.docker.com/products/docker-desktop)
  * [Windows](https://www.docker.com/products/docker-desktop)
* Ensure Docker is running.

### 2. Install VS Code & Extensions

* Install [Visual Studio Code](https://code.visualstudio.com/).
* Add the **Remote – Containers** extension:

  1. Open the Extensions panel (`Ctrl+Shift+X` or `Cmd+Shift+X`).
  2. Search for **Remote - Containers** and install it.

### 3. Open Folder in Container

1. Clone the repo (if you haven’t already):

   ```bash
   git clone https://github.com/your-org/demos-client.git
   cd demos-client
   ```
2. In VS Code, run the **Remote – Containers: Open Folder in Container…** command (`F1` → “Remote – Containers: Open Folder in Container…”).
3. Select the `demos-client` folder. VS Code will look for a `.devcontainer` configuration in the root.

> **If you don’t have an existing `.devcontainer` folder**:
> You can scaffold one quickly by running **Remote – Containers: Add Development Container Configuration Files** in VS Code and choosing a Node.js (TypeScript) template. Then customize the Dockerfile or `devcontainer.json` as needed.

A typical `devcontainer.json` might look like:

```jsonc
{
  "name": "DEMOS Client",
  "image": "mcr.microsoft.com/vscode/devcontainers/typescript-node:0-18",
  "workspaceFolder": "/workspace",
  "forwardPorts": [5173],
  "postCreateCommand": "npm install",
  "settings": {
    "terminal.integrated.shell.linux": "/bin/bash"
  },
  "extensions": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 4. Container Rebuild & Start

* If this is your first time, VS Code will build the container image (may take a few minutes).
* Once built, a new VS Code window attaches to the container.
* The `postCreateCommand` runs `npm install` automatically.
* In the integrated terminal, start the dev server:

  ```bash
  npm run dev
  ```
* The container forwards port 5173 (default Vite port). Open `http://localhost:5173` in your browser.

---

## Available npm Scripts

In the project root, you can run:

```bash
npm run dev        # Start Vite in development mode (live reloading)
npm run build      # Build for production; outputs to /dist
npm run preview    # Preview the production build locally
npm run lint       # Run ESLint against src/
npm run lint:fix   # Fix linting errors automatically
npm run test       # Run Vitest (unit tests)
npm run coverage   # Generate code coverage report (Vitest)
npm run analyze    # Visualize bundle size with vite-bundle-visualizer
```

---

## Linting & Testing

* **ESLint**:

  * Configured to lint all files under `src/`.
  * To check for linting errors:

    ```bash
    npm run lint
    ```
  * To auto-fix issues:

    ```bash
    npm run lint:fix
    ```
  * To auto-fix issues in VS Code:
    Command + Shift + P
    Select "Eslint: Fix all Auto fixable Problems" from Command Palette

* **Vitest**:

  * Unit tests live alongside components or in a separate `tests/` folder.
  * Run tests:

    ```bash
    npm run test
    ```
  * View coverage:

    ```bash
    npm run coverage
    ```

* **Testing Library**:

  * `@testing-library/react`, `@testing-library/user-event`, and `@testing-library/jest-dom` are included for component testing.

---

## Building for Production

When you’re ready to produce optimized assets:

1. From the project root, run:

   ```bash
   npm run build
   ```
2. The output folder `/dist` will contain a static HTML/CSS/JS bundle.
3. Serve `/dist` with any static web server (e.g., Nginx, Surge, Vercel, Netlify).

---

## Troubleshooting

* **“Port 5173 is already in use”**

  * Either kill the process using that port or modify the `vite.config.ts` to use a different port:

    ```ts
    // vite.config.ts
    export default defineConfig({
      server: { port: 3000 /* choose an open port */ },
      …
    });
    ```

* **Dev Container fails to build**

  * Ensure Docker Desktop is running.
  * Check your Dockerfile / `devcontainer.json` for correct base image and syntax.
  * Increase Docker resources (CPU/Memory) via Docker Desktop Preferences if builds time out.

* **ESLint errors prevent compilation**

  * Fix warnings or errors manually, or use `npm run lint:fix` for auto-fixable issues.

* **Vitest tests failing due to missing environment variables**

  * Confirm any required vars are defined in a `vitest.env.ts` or in `process.env` before running tests.
  * Alternatively, mock those variables in the test setup.

---

## Summary

* **macOS/Windows (npm)**

  1. `git clone …`
  2. `npm install`
  3. (Optional) Configure `.env`
  4. `npm run dev`

* **VS Code Dev Containers**

  1. Install Docker & VS Code + Remote – Containers
  2. Open folder in container
  3. `npm install` (runs automatically)
  4. `npm run dev`

That’s it—you should now have a local, live-reloading DEMOS Client up and running. If you run into any issues, consult the [Troubleshooting](#troubleshooting) section or open an issue in Jira.
