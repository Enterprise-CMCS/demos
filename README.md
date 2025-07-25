# Demonstration Evaluation & Management Oversight System (DEMOS)

This is the repository for DEMOS, the Demonstration Evaluation & Management Oversight System.

## About the Project

**{project_statement}**


### Project Vision
**{project vision}** 


### Project Mission
**{project mission}** 

## Core Team

A list of core team members responsible for the code and documentation in this repository can be found in [COMMUNITY.md](COMMUNITY.md).

## Repository Structure

<!-- TODO: Including the repository structure helps viewers quickly understand the project layout. Using the "tree -d" command can be a helpful way to generate this information, but, be sure to update it as the project evolves and changes over time. -->
<!--TREE START--><!--TREE END-->

**{list directories and descriptions}**

<!-- TODO: Add a 'table of contents" for your documentation. Tier 0/1 projects with simple README.md files without many sections may or may not need this, but it is still extremely helpful to provide "bookmark" or "anchor" links to specific sections of your file to be referenced in tickets, docs, or other communication channels. -->

**{list of .md at top directory and descriptions}**

# Development and Software Delivery Lifecycle

The following guide is for members of the project team who have access to the repository as well as code contributors. The main difference between internal and external contributions is that external contributors will need to fork the project and will not be able to merge their own pull requests. For more information on contributing, see: [CONTRIBUTING.md](./CONTRIBUTING.md).

## Local Development

<!--- TODO - with example below:
This project is monorepo with several apps. Please see the [api](./api/README.md) and [frontend](./frontend/README.md) READMEs for information on spinning up those projects locally. Also see the project [documentation](./documentation) for more info. -->

## Coding Style and Linters

<!-- TODO - Add the repo's linting and code style guidelines -->

Each application has its own linting and testing guidelines. Lint and code tests are run on each commit, so linters and tests should be run locally before commiting.

## Branching Model

<!--- TODO - with example below:
This project follows [trunk-based development](https://trunkbaseddevelopment.com/), which means:

* Make small changes in [short-lived feature branches](https://trunkbaseddevelopment.com/short-lived-feature-branches/) and merge to `main` frequently.
* Be open to submitting multiple small pull requests for a single ticket (i.e. reference the same ticket across multiple pull requests).
* Treat each change you merge to `main` as immediately deployable to production. Do not merge changes that depend on subsequent changes you plan to make, even if you plan to make those changes shortly.
* Ticket any unfinished or partially finished work.
* Tests should be written for changes introduced, and adhere to the text percentage threshold determined by the project.

This project uses **continuous deployment** using [Github Actions](https://github.com/features/actions) which is configured in the [./github/workflows](.github/workflows) directory.

Pull-requests are merged to `main` and the changes are immediately deployed to the development environment. Releases are created to push changes to production.
-->

## Contributing

Thank you for considering contributing to an Open Source project of the US Government! For more information about our contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Community

The DEMOS team is taking a community-first and open source approach to the product development of this tool. We believe government software should be made in the open and be built and licensed such that anyone can download the code, run it themselves without paying money to third parties or using proprietary software, and use it as they will.

We know that we can learn from a wide variety of communities, including those who will use or will be impacted by the tool, who are experts in technology, or who have experience with similar technologies deployed in other spaces. We are dedicated to creating forums for continuous conversation and feedback to help shape the design and development of the tool.

We also recognize capacity building as a key part of involving a diverse open source community. We are doing our best to use accessible language, provide technical and process documents, and offer support to community members with a wide variety of backgrounds and skillsets.

### Community Guidelines

Principles and guidelines for participating in our open source community are can be found in [COMMUNITY.md](COMMUNITY). Please read them before joining or starting a conversation in this repo or one of the channels listed below. All community members and participants are expected to adhere to the community guidelines and code of conduct when participating in community spaces including: code repositories, communication channels and venues, and events.

## Governance

<!-- TODO: Make a short statement about how the project is governed (formally, or informally) and link to the GOVERNANCE.md file.-->

Information about how the DEMOS community is governed may be found in [GOVERNANCE.md](GOVERNANCE.md).

## Feedback

If you have ideas for how we can improve or add to our capacity building efforts and methods for welcoming people into our community, please let us know at **{contact_email}**. If you would like to comment on the tool itself, please let us know by filing an **issue on our GitHub repository.**

## Glossary

Information about terminology and acronyms used in this documentation may be found in [GLOSSARY.md](GLOSSARY.md).

## Policies

### Open Source Policy

We adhere to the [CMS Open Source
Policy](https://github.com/CMSGov/cms-open-source-policy). If you have any
questions, just [shoot us an email](mailto:opensource@cms.hhs.gov).

### Security and Responsible Disclosure Policy

_Submit a vulnerability:_ Vulnerability reports can be submitted through [Bugcrowd](https://bugcrowd.com/cms-vdp). Reports may be submitted anonymously. If you share contact information, we will acknowledge receipt of your report within 3 business days.

For more information about our Security, Vulnerability, and Responsible Disclosure Policies, see [SECURITY.md](SECURITY.md).

### Software Bill of Materials (SBOM)

A Software Bill of Materials (SBOM) is a formal record containing the details and supply chain relationships of various components used in building software.

In the spirit of [Executive Order 14028 - Improving the Nation’s Cyber Security](https://www.gsa.gov/technology/it-contract-vehicles-and-purchasing-programs/information-technology-category/it-security/executive-order-14028), a SBOM for this repository is provided here: https://github.com/Enterprise-CMCS/demos/network/dependencies.

For more information and resources about SBOMs, visit: https://www.cisa.gov/sbom.

## Public domain

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/) as indicated in [LICENSE](LICENSE).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request or issue, you are agreeing to comply with this waiver of copyright interest.



## Environment

We make use of [devcontainers](https://containers.dev/) to manage the various aspects of the project. For local development, VSCode will be able to detect and run the devcontainer correctly if you open the root of the project.

Alternatively, you can also install the [devcontainers/cli](https://github.com/devcontainers/cli) tool. Mac users may use `homebrew` to install `devcontainer` if desired.

## Getting Started

If using the command line, navigate to the root of the repository and execute the following.

```zsh
devcontainer up --workspace-folder .
```

Alternatively, you can simply open the repository in VSCode and follow the on-screen prompting.

If this is the first time the devcontainer has been run, it will build, which may take some time; if you have issues with downloads, consider disconnecting from any VPN software that might be interfering.

## Getting A Console Session

Use the following commands to get a console session inside the devcontainer. Note that you will be running on the `app` container.

```zsh
devcontainer exec --workspace-folder . /bin/zsh
```

Within VSCode, terminals will automatically be opened within the `app` container.

## Running the Application

You will need to run the server and the client.

### Server Side

For your first run, you'll want to seed the database with fake data, and then run the server. The seed command is not necessary on subsequent runs unless you want freshly seeded data.

```zsh
cd server
npm ci
npm run seed
npm run dev
```

### Client Side

```zsh
cd client
npm ci
npm run dev
```

### Localstack for Lambdas

To facilitate local development of the AWS Lambda function that serves as the GraphQL endpoint, you can use the included LocalStack configuration. From inside the devcontainer, run the following (note this assumes you have already seeded the database and have a functioning installation of the server):

```zsh
cd server/localstack
./localstack.sh
```

This will drop any existing LocalStack resources and replace them with appropriate new ones. There is no persistence of this across runs, so you will need to run the script every time you start the devcontainer. Obviously, after any changes to the server code, you should also run the command to deploy your new version via LocalStack.

When the script finishes running, it will output the API Gateway URL you should use - something like this:

```
API Gateway URL: http://localhost:4566/_aws/execute-api/yvbkw90rxr/local
```

You should be able to use this URL from something like Bruno to make API calls against the database. Note that if you are making calls from _inside_ the devcontainer, you should replace `localhost` with `localstack`; this is because within the broader devcontainer environment, the DNS for the container running LocalStack is just `localstack`.
