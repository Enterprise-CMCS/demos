# DEMOS Server

This is the server / back-end portion of the Demonstration Evaluation & Management Oversight System (DEMOS).

# Tooling

We use [Prisma](https://www.prisma.io/) as our ORM and [Apollo Server](https://www.apollographql.com/docs/apollo-server) as our GraphQL server.

# Structure

The server code is found in `server/`, and all paths in this documentation refer to folders / files within that folder, unless otherwise specified. When referring to a path outside of the `server/` folder, the path will be prefixed with a forward slash, which represents the root of the repository.

## General

Below is a generic version of the structure of the back-end.

```
|-- src/
|   |-- auth/
|   |   `-- auth.config.ts
|   |   `-- auth.util.ts
|   |-- model/
|   |   |-- _manyToManyJoinTable/
|   |   |   |-- manyToManyJoinTable.prisma
|   |   |   `-- manyToManyJoinTableHistory.prisma
|   |   |-- someTable/
|   |   |   |-- someTable.prisma
|   |   |   `-- someTableHistory.prisma
|   |   |-- anotherTable/
|   |   |   `-- anotherTable.prisma
|   |   |-- yetAnotherTable/
|   |   |   |-- yetAnotherTable.prisma
|   |   |   |-- yetAnotherTableHistory.prisma
|   |   |   |-- yetAnotherTableResolvers.ts
|   |   |   `-- yetAnotherTableSchema.ts
|   |   |-- migrations/
|   |   |   |-- 20251231120000_migration_name/
|   |   |   |  `-- migration.sql
|   |   |   `-- migration_lock.toml
|   |   |-- graphql.ts
|   |   |-- schema.prisma
|   |-- constants.ts
|   |-- index.ts
|   |-- prismaClient.ts
|   |-- seeder.ts
|   |-- server.ts
|   `-- types.ts
```

* The `auth/` folder contains the authorization module.
* The `model/` folder contains Prisma models and related GraphQL resolvers and schema. It also contains Prisma migrations within the `migrations` folder. Models will be discussed more below.
* `constants.ts` stores constants for use throughout the codebase. Magic strings that are used repeatedly should be made into constants with a consistent definition found here.
* `index.ts` runs Apollo Server and hosts the API. This version is strictly for local / development use, as the actual deployed version is found in `server.ts`. They are different files due to the launch configuration requirements for AWS Lambda.
* `prismaClient.ts` is where the Prisma client instantiation is defined. You will import and use this in all your resolvers to access the Prisma models.
* `seeder.ts` is a script for seeding synthetic data into local / development databases. It also serves as a confirmation that your models are working as expected. You should add to or update the seeder for any model changes, to ensure that the data inserts as expected.
* `server.ts` is the deployment version of `index.ts`, suitable for using within AWS Lambda.
* `types.ts` allows for exporting the types used on the server so that the client can also use them. It is also where types used within the server code (for example, derived from constants) can be defined.

## Models and Resolvers

The `model/` folder contains Prisma models, their accompanying GraphQL schemas and resolvers, and Prisma migrations. In addition, the `graphql.ts` and `schema.prisma` files are found here as well.

`graphql.ts` imports the GraphQL schemas and resolvers from the different models, and then exposes them to the server via exporting `typeDefs` and `resolvers`. When you add a new set of models, you need to add them here to make them usable.

`schema.prisma` is a standard Prisma configuration file defining the data source and other build parameters. Also, any types that need to be defined within the database (e.g. `ENUM` types) should be added here.

In general, the `model/` folder is structured so that every folder is a single model, and that every model is associated to a single table in the database.

> There is a small caveat here: history tables. Some tables have trigger-based logging within the database, where all operations on that table insert a record into the corresponding history table. Those history tables are not exposed via GraphQL and are not interacted with via API. For tables that have history logging, we define the corresponding history table in the same folder as the model.

Models are named using PascalCase (for instance, `DocumentProcessingStep`). The folders and files containing the models are named in camelCase (e.g. `documentProcessingStep/documentProcessingStep.prisma`). IF a model represents a join table (i.e. a many-to-many associative table), the folder name gets prefixed with an underscore; the file and model names are not changed.

Each model folder will generally have up to four files. For the hypothetical `DocumentProcessingStep` model, these might be:

* `documentProcessingStep.prisma`: The Prisma model representing the table itself in the database. This is where columns and relations are defined.
* `documentProcessingStepHistory.prisma`: This is the history table specification; this is the file that is read by the `history_trigger_generator` script found in `data/utilities/scripts` in the project root, which automatically builds triggers to include in migration files.
* `documentProcessingStepResolvers.ts`: These are the GraphQL resolvers relating to this model.
  * Note that join tables will not have resolvers; the resolvers for those models should be built on either end of the joining models (e.g. changes to the `UserRole` model should be made on either the `User` or `Role` model).
* `documentProcessingStepSchema.ts`: This is the GraphQL schema for the model. This file is linted via the custom rules found in `/server/eslint-rules` to ensure that the TypeScript and GraphQL types in this file match.

If a model has a `Resolvers.ts` file, it should also have a `Schema.ts` file.

## Model File Standards

We break our Prisma model files into four sections.

1. An optional set of flags as comments at the top of the file.
2. The database columns (known in Prisma as "scalar fields").
3. The database relations (known in Prisma as "relation fields").
4. Table constraints and other parameters.

Below is a hypothetical example of our Prisma model format.

```
model Proposal {
  id                    String @default(uuid()) @db.Uuid
  title                 String
  description           String
  primaryReviewerUserId String @map("primary_reviewer_user_id") @db.Uuid
  createdAt             DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt             DateTime @updatedAt @map("updated_at") @db.Timestamptz()

  primaryReviewer User             @relation(fields: [ownerUserId], references: [id])
  proposalAuthors ProposalAuthor[]

  @@id([id])
  @@map("proposal")
}
```

### Flags / Comments

This file has none of the flags at the top, so they are omitted entirely.

Flags can be added using the format:

```
// Flags: ONE_OR_MORE_OF_THEM, SEPARATED_BY_COMMAS
// One optional comment explaining some of the flags
```

The flags we've identified as useful are:

* `NATURAL_KEY`:
  * Meaning: The table uses a human-readable / natural key, rather than a UUID or something similar.
  * Explanation Comment: Not required.
* `NO_HISTORY`:
  * Meaning: This table does not have an accompanying history table.
  * Explanation Comment: Required; include reason in your comment.
* `NO_CREATED_TS`:
  * Meaning: This table does not have a `createdAt` / `created_at` field.
  * Explanation Comment: Required; include reason in your comment.
* `NO_UPDATED_TS`:
  * Meaning: This table does not have an `updatedAt` / `updated_at` field.
  * Explanation Comment: Required; include reason in your comment.


### Scalar Fields

In Prisma, fields that exist on the model and in the database are known as "scalar fields". We put all the scalar fields as the first block in a model, followed by an empty line.

```
  id                    String @default(uuid()) @db.Uuid
  title                 String
  description           String
  primaryReviewerUserId String @map("primary_reviewer_user_id") @db.Uuid
  createdAt             DateTime @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt             DateTime @updatedAt @map("updated_at") @db.Timestamptz()
```

### Relation Fields

### Table Constraints / Parameters

# How To Guides

## Getting Started

The easiest path is using the `devcontainer` setup as documented in the [Main Readme](../README.md#environment). Once you are inside the container, for the first run, you'll want to seed the database with fake data and then run the server.

```zsh
cd server
npm install
npm run seed
npm run watch
```

You may run the seeder as much as you like. Note that `npm run seed` both rebuilds the DB schemas from the ground up, and then loads data into them. If you just want to drop and reload data (for instance, to check that history tracking is working), you can use `tsx --inspect ./src/seeder.ts` to just run that portion.

## Localstack for Lambdas

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
