# Node Version Management with nvm

This project uses [nvm](https://github.com/nvm-sh/nvm) to manage Node.js versions. The required Node version is specified in the [.nvmrc](./.nvmrc) file.

---

## Install nvm

**macOS/Linux:**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# or

wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Then add the following to your shell profile (~/.bashrc, ~/.zshrc, etc.) if it's not added automatically:
bash

```
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

**Windows**:
Use [nvm-windows](https://github.com/coreybutler/nvm-windows#installation--upgrades) instead. Download and install from the [releases page](https://github.com/coreybutler/nvm-windows/releases).

## Using nvm with this project

Once nvm is installed, run the following from the project root:
bash

```
nvm install    # installs the Node version listed in .nvmrc
nvm use        # switches to that Node version
```

This ensures you're using the same Node version as other developers and CI pipelines.
