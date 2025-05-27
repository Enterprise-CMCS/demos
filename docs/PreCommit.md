# Pre-Commit Hooks

This project is configured with pre-commit hooks to prevent simple issues before pushing code to the repository. The hooks are configured using the tool [pre-commit](https://github.com/pre-commit/pre-commit)

## Installing pre-commit

Using pip:

```
pip install pre-commit
```

Using Homebrew:

```
brew install pre-commit
```

Validate install:

```
pre-commit --version
```

## Installing the hook

Once you have cloned the repo and installed pre-commit, you should first run:

```
pre-commit install
```

This will set up your local pre-commit hook that will run before every commit. The configuration of the hooks is stored in [.pre=commit-config.yaml](./.pre-commit-config)

You can also run `pre-commit run --all-files' at any time

## Pre Commit Checks

The current pre-commit checks that are preformed;

- Reject any files larger than 500kb (default value, but can be customized if needed)
- Prevent commits to `main` branch
- Prevent naming files that could conflict on case-insensitive file systems
- [gitleaks](https://github.com/gitleaks/gitleaks)
- [detect-secrets](https://github.com/Yelp/detect-secrets)
