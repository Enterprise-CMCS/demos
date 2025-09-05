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
|   |-- local-server.ts
|   |-- prismaClient.ts
|   |-- seeder.ts
|   |-- server.ts
|   `-- types.ts
```

* The `auth/` folder contains the authorization module.
* The `model/` folder contains Prisma models and related GraphQL resolvers and schema. It also contains Prisma migrations within the `migrations` folder. Models will be discussed more below.
* `constants.ts` stores constants for use throughout the codebase. Magic strings that are used repeatedly should be made into constants with a consistent definition found here.
* `local-server.ts` runs Apollo Server and hosts the API. This version is strictly for local / development use, as the actual deployed version is found in `server.ts`. They are different files due to the launch configuration requirements for AWS Lambda.
* `prismaClient.ts` is where the Prisma client instantiation is defined. You will import and use this in all your resolvers to access the Prisma models.
* `seeder.ts` is a script for seeding synthetic data into local / development databases. It also serves as a confirmation that your models are working as expected. You should add to or update the seeder for any model changes, to ensure that the data inserts as expected.
* `server.ts` is the deployment version of `local-server.ts`, suitable for using within AWS Lambda.
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

# Standards and Conventions

This section covers coding / design standards and conventions. These are not intended to be iron-clad rules, but instead, to give general guidance about expectations. If you have questions or think something should deviate from these standards, bring it up! The goal is to provide a set of guidance that covers 80-90% of the day-to-day scenarios encountered, not to completely limit flexibility in favor of standardization.

## Constraints and Business Logic

The data model, and in turn, the DEMOS database, is designed to try and reflect the business logic of the DEMOS program as much as possible. Constraints are implemented in the database whenever possible because this ensures that even if the data is updated via a manual process, core logic is enforced.

However, when possible, the server will also expose this information to the front-end via exports from the server codebase. Doing this adds a small overhead in maintenance because the constraint information must be maintained in both the database and the codebase; however, the overhead is generally minimal for the benefit, which is consistent enforcement of constraints at the database level.

Conceptually, constraints can be considered to either be "dynamic" or "static". A dynamic constraint is one that may change over time as users interact with the application. For instance, a dropdown menu of all the amendments of a demonstration will change as more amendments are added. The values in this type of constraint change so frequently that it is impossible to include them in the code.

In contrast, a static constraint is one that is generally unchanging. While it may change, such changes would be significant changes to the application, and would require planning and implementation. An example of this would be a dropdown to assign a demonstration to a state; the list of states is generally unchanging. While it is impossible to add dynamic constraints to the code base, it would be possible to do this for static constraints.

In the case of static constraints where there are a small number of values (generally less than 10), the constraint values should be exported from the server codebase as an object which provides the acceptable values, and a TypeScript type derived from that object.

### Static Constraints: Tables vs. Enums

In general, static constraints should be implemented via a constraint table, not as database enums. The reason for this is to decrease maintenance overhead if, in the future, additional levels must be added to the acceptable options. With enums, this generally requires dropping and recreating the enum, which in turn causes challenges with casting existing values that may be in the database. Instead of an enum, static constraints should be implemented using constraint tables in the database.

In almost all cases, such static constraints do not require a distinction between the display value and the internal database ID, unless it is relevant for other development reasons. For instance, there is minimal value in having a table where the `id` field is `[NEW, IN_PROGRESS, COMPLETE]` and the `name` field is `[New, In Progress, Complete]`. Such a constraint can just use the display value.

There may be exceptions to this. For instance, it is useful in the `state` table to store both the state code as the `id` and the state name as the `name`. This lets you display either `OH`, or `Ohio` as needed. However, for most cases, a constraint table does not need to have more than a single column, since it is trying to replicate the behavior of an enum.

Tables of this type - serving as constraints, and with a single column - are called "static constraint tables" in this document.

## Model File Standards and Conventions

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

  primaryReviewer User   @relation(fields: [primaryReviewerUserId], references: [id])
  authors         User[]

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
* `STATIC_CONSTRAINT`:
  * Meaning: This table exists entirely as a static constraint table as discussed [above](#static-constraints-tables-vs-enums). If this is present, no other flags should be used.
  * Explanation Comment: Not required.

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

Putting these here, and then adding an empty line, means that they will be formatted as a single block when you run `prisma format`. It also helps to distinguish between the part of the Prisma file that contains strictly column definitions, from the section containing the relation fields.

Table and column naming standards are described [below](#database-guidelines-and-conventions). Note that, in Prisma, you ___cannot___ have a relation field and a scalar field with the same name. This means that, barring rare exceptions, every scalar field that is constrained by a foreign key will have an `_id` suffix to avoid name collisions.

Fields are named using camelCase. By default, Prisma will quote the names you give in the model and put them as-written into the database. However, we use snake_case when in the database. As a result, any field which contains more than one word must have an `@map` statement, which maps the Prisma name to some alternative. So, for instance, above, `primaryReviewerUserId` has `@map("primary_reviewer_user_id")` to ensure that the database name is consistent with our naming schema.

Any fields that are present as part of a relation field (described [below](#relation-fields)) should also be found here.

### Relation Fields

Fields that exist strictly on the model, but not in the database, are known as "relation fields". This name indicates that they are used to connect two models together.

We put all the relation fields in the second block in the model, followed by an empty line, for similar reasons as we do for the scalar fields. You can read more about relation fields [here](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations#relation-fields).

Unlike scalar fields, do not name relation fields with suffixes like `UserId` or `Id`. They are referring to other Prisma objects, not to specific columns in the database.

```
  primaryReviewer User   @relation(fields: [primaryReviewerUserId], references: [id])
  authors         User[]
```

Above, there are two relation fields defined.

The `primaryReviwer` has type `User` and is related to the `User` model via the `@relation` statement (in this case, the statement says that the `primaryReviewerUserId` must be an element of `User.id`).

The `authors` relation field tells us that there is a list of `User` objects associated with this. You'll note that there's no connection information here. In Prisma, a relation field must be present on _both ends_ of the relationship. In this context, this probably means that there's a constraint elsewhere in the database to a join table. Fortunately, `prisma format` automatically adds in the other end of relationships in case you forget to do so. Just be sure to fix the names, as by default, `prisma format` adds them in using PascalCase and not camelCase.

You can denote an optional connection by using `?` after the type (e.g. `User?`). If you do this, be sure to also mark the scalar field as optional in the same way. When you do this, Prisma will automatically generate the SQL with a constraint where on delete, the values are set to `NULL`. This may not be desired functionality - if so, edit the generated SQL accordingly.

### Table Constraints / Parameters

The last part of the model file is the table-level constraints and parameters. These are prefixed with two `@` symbols. Like `@map` on a column, `@@map` gives a database-specific name to a model. This is necessary on all models to make them snake_case (even single-word models will need this to avoid being capitalized and quoted in the SQL / database).

More complex ID and unique constraints can be defined in this section. You may put `@id` in-line for tables with a single-column ID, but putting it at the bottom is preferred for consistency.

```
  @@id([id])
  @@map("proposal")
```

## GraphQL Standards and Conventions

GraphQL types and inputs should be named using PascalCase (similar to Prisma models). However, mutations and queries should be named using camelCase. Here's an example of what the GraphQL schemas might look like for the Proposal object discussed above. (This does not have all possible types of mutator described below.)

```typescript
import { gql } from "graphql-tag";
export const proposalSchema = gql`
  type Proposal {
    id: ID!
    title: String!
    description: String!
    primaryReviewer: User!
    authors: [User!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  input CreateProposalInput {
    title: String!
    description: String!
    primaryReviewerUserId: ID!
  }

  input UpdateProposalInput {
    title: String!
    description: String!
    primaryReviewerUserId: ID!
  }

  type Mutation {
     createProposal(input: CreateProposalInput!): Proposal
     updateProposal(id: ID!, input: UpdateProposalInput!): Proposal
     deleteProposal(id: ID!): Proposal
  }

  type Query {
    proposals: [Proposal!]!
    proposal(id: ID!): Proposal
  }
`
```

Every set of GraphQL types needs a corresponding set of TypeScript types. In your `schema.ts` file, after the GQL section, you would define them as follows.

```typescript
import { User } from "../user/userSchema.js";
export type DateTime = Date;
export interface Proposal {
  id: string;
  title: string;
  description: string;
  primaryReviewer: User;
  authors: User[];
  createdAt: DateTime;
  updatedAt: DateTime;
}

export interface CreateProposalInput {
  title: string;
  description: string;
  primaryReviewerUserId: string;
}

export interface UpdateProposalInput {
  title?: string;
  description?: string;
  primaryReviewerUserId?: string;
}
```

A few notes:

* GQL and TypeScript have slightly different ways of denoting optional / required fields.
* GQL doesn't have a native DateTime type, but we are using the [GraphQL Scalars](https://the-guild.dev/graphql/scalars) package for these. The DateTime type from this package is equivalent to the Date type in TypeScript. To ensure that our custom linting works correctly and does not identify a mismatch in the types between GraphQL and TypeScript, we create the `DateTime` type as being the same as the `Date` one.
* Note that for inputs, we accept a specific `primaryReviewerUserId`; however, for the actual `Proposal` type, the field is `primaryReviewer` and has the type `User`. This is expected; the type shows the nested nature of the object, while the inputs accept specific IDs for use in the resolver code.
  * In general, you will use the "relational field" names and types from Prisma on the object type, and the "scalar field" names and types on the inputs.
  * The exception for this is cases where a relational field exists to a static constraint table. In those cases, you can use the relational field name throughout, since the intent of the static constraint table is to simply constrain the display value.
* Human-readable ID fields should be given the GraphQL type of `String`, while synthetic / meaningless keys (i.e. UUIDs) should be given the type of `ID`. This is consistent with [GraphQL documentation](https://graphql.org/learn/schema/):

  > ID: A unique identifier, often used to refetch an object or as the key for a cache. The ID type is serialized in the same way as a String; however, defining it as an ID signifies that it is not intended to be human‐readable.

  Within TypeScript, both are `string` types, since GraphQL treats the `ID` type as a string under the hood.
* As described [below](#static-constraint-types), use custom types for static constraint tables.

### Static Constraint Types

In cases where a field is constrained by a static constraint table, you should create a type to denote this in both GraphQL and TypeScript.

In GraphQL, we are accomplishing this by declaring custom scalars, without implementing any actual restrictions. This is effectively denoting them as special strings. The main value of this is that they will be specially noted in the Apollo interface, and you can include information about the expected values in the documentation.

The below would be done in your `Schema.ts` file.

```typescript
import { gql } from "graphql-tag";
export const reviewSchema = gql`
  """
  A string representing a review status. Expected values are:
  - New
  - In Progress
  - Complete
  """
  scalar ReviewStatus
  ...
`
```

Later, you will want to add corresponding TypeScript types. You'll add two items: an array of the acceptable values, and a type derived from that (and having the same name as the scalar you added to the GQL). Put the array into `src/constants.ts` and the type into `src/types.ts`. Remember that any changes made here will need to be reflected in the database, and vice versa!

```typescript
// constants.ts
export const REVIEW_STATUS = ["New", "In Progress", "Complete"] as const;

// types.ts
import { REVIEW_STATUS } from "./constants.js";
export type ReviewStats = (typeof REVIEW_STATUS)[number];
```

Import your new type into the `Schema.ts` file you are working on, and use it throughout as appropriate. The advantage of this approach is that now, the front-end can make use of the exported type during type checking, and can use the exported constant to populate menus, etc, without hitting the database to retrieve a list of values.

As a reminder, this approach is intended for cases where the constraint is rarely changing, and where it has a tractable number of levels (10 or fewer, generally).

## Resolver Standards and Conventions

Every object should have a resolver and schema definition which provides for the following:

* [Queries](#queries)
* [Mutators](#mutators)
* [Field Resolvers](#field-resolvers) (if relevant)
* [Type Resolvers](#type-resolvers) (if relevant)

However, as noted above, there is no need to add resolvers for associative / join tables; the resolvers relating to these should be on the objects being associated, not on the associative table itself.

Resolvers relating to a specific model are stored in the same folder as the model, as described in [Structure](#structure).

### Field Naming

As shown in the schema section, resolvers are named using camelCase, as are the fields (just like the Prisma models). The types are named via PascalCase, again, consistent with the actual names of the Prisma models.

### Queries

An object will most likely have two queries: one to retrieve a single item, and one to retrieve a list of items (possibly with some filtering). Do not prefix these with `get` or something similar; by definition, they are already `Query` actions in GraphQL, so getting things is implied. Instead, simply refer to the queries as the singular and plural names of the object. For instance, a proposal object should have `proposal` and `proposals` queries.

The singular query should look up the entity by its ID unless there is compelling reason to use another identifier. Be cautious with adding filtering to the list query. In general, if filtering is needed, it should be accomplished by retrieving the item from the resolver associated with the specific object being used for filtering. Using our Proposal item above, if proposals are connected to authors, you wouldn't want to add a `proposalsByAuthor` query. Instead, you would retrieve the relevant author and then get the `proposals` object from its field resolvers.

Note that it's acceptable to have fields in a query / return type that are not one-to-one matches to the database. Ideally, we will harmonize the names of the Prisma relation fields with the GraphQL models, but there may be instances where this makes less sense - the API may not need to use names with as much precision as is useful in the database. As long as this is properly documented, there are no issues. Similarly, there may be times when a constructed field is needed in a query response (for instance, if a query has a key that may return different types, it can be useful to denote what type of thing is being returned at the top level).

### Mutators

Mutators are named using a standard syntax and with standard inputs.

| Mutator | Meaning | Example |
|---------|---------|---------|
| `createX` | Create a new X. | Create a new proposal. |
| `updateX` | Update fields that accept a single value for a specific X. | Change the title of a proposal. |
| `deleteX` | Delete a specifc X. | Delete an existing proposal. |
| `addYsToX` | Add one or more Ys to a specific X. | Add an author to a proposal. |
| `removeYsFromX` | Remove one or more Ys from a specific X. | Remove two authors from a proposal. |
| `setYsForX` | Set a list of Y on X. | Remove all existing authors on a proposal and replace them with a new list. |

| Mutator | Arguments | Notes |
|---------|-----------|-------|
| `createX` | `input`: Required and optional keys | May include `id`, generally in cases where `id` is human-readable. |
| `updateX` | `id`: ID to update, `input`: Update values. | Generally, all values in `input` should be optional. |
| `deleteX` | `id`: ID to delete. | |
| `addYsToX` | `XId`, `YIds`: A single `XId` and a list of `YIds` to add to it. | |
| `removeYsFromX` | `XId`, `YIds`: A single `XId` and a list of `YIds` to remove from it. | |
| `setYsForX` | `XId`, `YIds`: A single `XId` and a list of `YIds` IDs; all existing associations are replaced by the list. | An empty list of `YIds` is equivalent to removing all associations. |

A few general rules that apply here are outlined below.

__Not All Mutators Are Required.__ You do not need to implement every possible combination of mutator for every object. The required mutators should be defined as part of the requirements. Without this, the amount of possible routes and combinations of queries rapidly become untenable.

__Create and Update Are For Single Values.__ In general, when creating a new item, only fields with a single value should be accepted, not lists of things to be associated. For instance, `createUser` should not accept a list of roles to assign to the user. Instead, `createUser` should be called, and then `addRolesToUser` or `setRolesForUser` should be used to add roles to the user. Similarly, `updateUser` should allow you to change the name of a user, but not change their roles; this is what `setRolesForUser` does.

__Add, Remove, and Set Should Be Defined In One Place.__ Usually, it is not necessary to define a resolver to perform operations from both directions. For instance, it would be redundant to have a resolver to add users to a role, and a separate resolver to add roles to a user. Ideally, a single route or definition should be derived from the requirements.
  * As with most things, there may be exceptions to this rule, which should be documented.
  * The model where these are implemented should be whatever X is. For instance, AddUserToRole would be defined on the Role model, while AddRoleToUser would be defined on the User model.

### Field Resolvers

Field resolvers tell GraphQL how to properly resolve nested fields on query objects. For instance, if you have a Proposal, which has several Authors, and the Authors each have multiple Proposals, GraphQL would support a query like this:

```
query Query {
  proposal(id: "some-id") {
    id
    title
    description
    authors {
      id
      proposals {
        id
        title
        description
      }
    }
  }
}
```

For this to work, _field resolvers_ will be necessary on the proposal and author models. These generally take the form of:

```
  Object: {
    objectField: async (parent: Object) => {
      return await prisma().objectField.findMany({
        where: {
          id: parent.objectFieldId
        },
      });
    },
```

These tell GraphQL that if I am looking for some field on object, to use this Prisma query to get back the results needed. By properly defining field resolvers, we enable something called resolver chaining, which gives our GraphQL system flexibility.

### Type Resolvers

Type resolvers are necessary in cases where a resolver might return a key that could have different types. They serve to allow GraphQL to understand the type of the returned object, and in turn, to properly check the requested fields for type safety.

When implemented, you can write queries using the `... on Type` notation to dynamically return different fields based on the resolved type of the object. For an example, consider a media library which contains both movies and books.

```
query MediaItems {
  mediaLibrary {
    items {
      ... on Movie {
        id
        director
        runtime
      }
      ... on Book {
        id
        author
        pageCount
      }
    }
  }
}
```

This is implemented using the `__resolveType` resolver function.

```
  MediaItem: {
    __resolveType(obj: Item) {
      if (obj.itemTypeId === "MOVIE") {
        return "Movie";
      } else if (obj.itemTypeId === "BOOK") {
        return "Book";
      }
    }
  },
```

## Database Standards and Conventions

1. __Name Formatting__: Use snake_case for all database-related items.
2. __Table Naming__: Tables should be named using the singular if possible (e.g. `author`, not `authors`). Exceptions to this are allowable for good reason. For instance, the word `USER` is reserved in SQL, so the table with users is called `users`. This is documented in the Prisma model. In contexts where the table name is made plural in this manner, do not make other references plural; having `user_id` in one table be constrained by `users.id` in the `users` table is correct.
3. __ID Columns__: Most tables will have a column named `id` which represents the identifier for that table. Do not prefix the ID with the name of the table (i.e. use `state.id`, not `state.state_id`).
4. __Foreign Keys__: When using a column in a table that references the ID column of another table, refer to it with a prefix. Ideally, you should simply use `table_name_id`. In some contexts, it is necessary to add additional context about the meaning of a column. For instance, the primary reviewer of a proposal is a user, but naming the column `user_id` is ambiguous. In those contexts, you can use the format of `meaningful_name_type_id`. So, `primary_reviewer_user_id` indicates the the column is the primary reviewer and that it is a user ID, meaning it can be looked up in `users.id`.
5. __Static Constraint Tables__: As described [above](#static-constraints-tables-vs-enums), a static constraint table should be used in favor of an `enum` in most cases. Such contraint tables will have a single column, `id`, which contains the valid values. Denote these tables with the `STATIC_CONSTRAINT` flag on their Prisma models. Static constraint tables should not have history tables, nor will they have resolvers; they are intended to implement an `enum`-like functionality.
5. __History Table Specifics__: Every history table should begein with three columns: `revision_id`, `revision_type`, and `modified_at`. These are expected by the Python tool which generates the triggers. Every other column should be reproduced from the source table, but no constraints or checks should be duplicated.

# How To Guides

## Getting Started

The easiest path is using the `devcontainer` setup as documented in the [Main Readme](../README.md#environment). Once you are inside the container, for the first run, you'll want to seed the database with fake data and then run the server.

```zsh
cd server
npm install
npm run seed
npm run watch
```

Alternatively. If you prefer to run prisma and the local code separately.
You can use same top three instructions
```zsh
cd server
npm install
npm run seed
```
Then run this to separate prisma and the code in separate shell sessions.
```zsh
npm run dev
npm run prisma
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

## Prisma Migrations

Prisma has a robust system which detects drift between the current state of the database and the Prisma models, and can generate SQL migration files to address this drift automatically. All of this functionality falls under the `prisma migrate` command.

Note that all of the commands here are appropriate when working in the devcontainer against the local development instance of PostgreSQL. You should verify that your `.env` file has you pointed to the local development DB before doing any of this - if you use the provided version, this should be true, but it's always good to check!

* `prisma migrate reset` drops the database and runs all the migrations found in the `migrations/` folder. You can use the `--force` flag to skip the confirmation dialogue. Oftentimes, you will have to do a `prisma migrate reset` when making changes to models; Prisma will prompt you at the terminal to do so. This is generally because the changes needed are not possible without dropping and recreating the data.
* `prisma migrate dev` is a complex command, as it is responsible for both generating new migrations and running them, which is not intuitive. (See also [this discussion](https://github.com/prisma/prisma/issues/11184) about the issues with this command.) When you run `prisma migrate dev`, it will try to generate a new migration in the `migrations/` folder that implements the changes to the models since the last migration.
  * If it is not possible to generate this automatically (for instance, if you need to change the type on a field that already exists, or drop a field that has data in it), Prisma will warn instead. You can use `--create-only` on this command to generate the SQL but not run it - this allows you to go edit in necessary code changes like dropping records, etc, in the SQL. Once you have the SQL the way you want, you can use `prisma migrate dev` to run it, though a `prisma migrate reset` may be necessary.
  * Note that if you generate a new migration, make additional model changes, and then run `primsa migrate dev` again, by default it will create a new migration, not update the previous one you made. If you are trying to keep your changes contained into a single migration per PR (which is usually a good idea), you will need to delete the previous migration before running `prisma migrate dev` again.
  * Keep in mind that you need to run the Python script found in `/data/utilities/scripts` to generate triggers for history tables. There is documentation in that folder and in the `--help` results for the script explaining how to use it. Also keep in mind that if you make changes to a table and the history table, the trigger needs to be regenerated; otherwise it will reference columns that may or may not exist.

An important point: ___read the SQL that is generated by your model changes and make sure it makes sense.___ At the end of the day, the migration SQL is what gets run to bring the database into the state desired. While Prisma is pretty good, there have been a few places where it generated seemingly unusual items (a constraint that set the field to `NULL` on delete, when the field is `NOT NULL`, for instance). Prisma gets almost everything right, but be sure to at least skim what is generated.
