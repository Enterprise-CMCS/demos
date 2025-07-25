# demosctl

`demosctl` is a utility to simplify builds and deployments. The script is used within Jenkins pipelines and can also be used locally to manage ephemeral environments

## Prerequisites

`cdk` and `tsx` should be installed globally. This allows the CDK to run and typescript files to be run directly without transpiling first

```
npm i -g cdk tsx
```

## Install

`demosctl` can be run without installing, but it'll save some typing. To install, navigate to the [`deployment`](../) directory and run:

```
npm ci
npm link
```

After installing you can call the utility with just `demosctl`. For example:

```
demosctl <command> <environment>
```

If you prefer not to install it, you can also run it like this:

```
npx tsx demosctl/index <command> <environment>
```

## Usage

All of the commands provided by the utility require an environment to be specified. For example, to start a new ephemeral environment, run:

```
demosctl up temp-name
```

For the `up` command, `temp-name` can be anything. The new environment will be created alongside the `dev` environment.

For commands like:

```
demosctl down temp-name
```

Its assumed that `temp-name` will be the name of an existing environment.
