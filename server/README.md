# DEMOS Server

This is the server / back-end portion of the Demonstration Evaluation & Management Oversight System (DEMOS).

# Tooling

We use [Prisma](https://www.prisma.io/) as our ORM and [Apollo Server](https://www.apollographql.com/docs/apollo-server) as our GraphQL server.

## Custom Prisma Middleware - Upsert / Update

We use a combination approach of a small amount of custom Prisma middleware and a database trigger to help suppress updates that change no values from being written in the database. While there are downsides to this - namely, that UPDATE statements now have to perform checks every time, increasing load on the database - this is a minimal risk for our project. We accomplish this through two components: a database trigger which discards any updates where the only changed field is `updated_at`, if it is present, and custom middleware for the `update` and `upsert` methods in Prisma which handles errors that arise from this.

The database trigger is straightforward. It runs before update on every row in the relevant tables. When triggered, it creates a record for the old and new values, and then tries to set the old `updated_at` value to the new `updated_at` value. It gracefully handles cases where `updated_at` is not part of the table structure.

> Note that `updated_at` is always sent by Prisma (thanks to the `@updatedAt` configuration object on relevant models) and is not part of the user-defined payload, so we do not have to worry about cases where a table _has_ an `updated_at` column, but it is not included in the payload. This would be an issue if the field was not always included as part of the payload thanks to Prisma, and is something to keep in mind regarding this pattern.

If the old and new records are identical after handling `updated_at`, the trigger returns `NULL`, aborting the update operation; otherwise, it just returns the new record values, allowing it to proceed as expected.

The database function works and is relatively simple; where it becomes an issue is in how Prisma interacts with the database. When Prisma performs an `update` or `upsert` operation (which would necessarily cause `UPDATE` statements to be used on the SQL side), it throws an error that _appears_ to be caused when the database returns a row change count of zero. The error it issues is actually `P2025`, with message "An operation failed because it depends on one or more records that were required but not found."

This message is somewhat misleading in the case of the trigger firing - after all, the record is found, it is just that the UPDATE statement returns no rows changed because the trigger prevents any changes from occurring. It seems that Prisma isn't actually checking for the existence of the row before running the `UPDATE`, and is instead relying on the modified row counts to decide whether to issue a `P2025` or not. In essence, the new database trigger creates "false positives" - `P2025` errors that are not actually errors.

To address this, we have inserted special error handling in the middleware for `upsert` and `update`. This handling catches cases of `P2025` and then uses `findUnique` with the same `where` clause to fetch the record. If the record is fetchable, we know that the `P2025` error is incorrect - the record does exist, and the reason for the error is that our trigger fired. In that case, we return the record (which is the expected behavior of `update` and `upsert` anyway); otherwise, we log the error and allow it to propagate normally.

It would be better if we could have the database raise a warning message that Prisma directly parses to make sure that what is happening is specifically the trigger firing. Unfortunately, support for this type of interaction is not present in Prisma at present. Alternative approaches like having the database throw an error cause issues with transactions being aborted, and pulling data into the server layer to check for whether true changes are occurring is expensive and introduces a larger (though still quite small) chance of concurrency issues. Accordingly, this approach seems to be the best compromise possible within Prisma at present.

# Structure

The server code is found in `server/`, and all paths in this documentation refer to folders / files within that folder, unless otherwise specified. When referring to a path outside of the `server/` folder, the path will be prefixed with a forward slash, which represents the root of the repository.

## General

Below is a generic version of the structure of the back-end.

```
|-- src/
|   |-- adapters/
|   |-- auth/
|   |-- errors/
|   |-- model/
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
|   |-- sql/
|   |   `-- functions.sql
|   |   `-- history_triggers.sql
|   |   `-- permissions.sql
|   |   `-- utility_views.sql
|   |-- constants.ts
|   |-- customScalarResolvers.ts
|   |-- dateUtilities.ts
|   |-- local-server.ts
|   |-- log.ts
|   |-- prismaClient.ts
|   |-- refreshDbObjects.ts
|   |-- seeder.ts
|   |-- server.ts
|   `-- types.ts
```

* The `adapters/` folder contains various adapters used mostly with S3 / AWS.
* The `auth/` folder contains the authorization module.
* The `errors/` folder contains custom errors.
* The `model/` folder contains Prisma models and related GraphQL resolvers and schema. It also contains Prisma migrations within the `migrations` folder. Models will be discussed more below.
* The `sql/` folder contains SQL that is run on every deploy (meaning it must be idempotent). This is for things like stored procedures and views. The following files are present:
  * `functions.sql` contains all the non-history related stored procedures and functions. Upon running, it purges all non-logging triggers and procedures and recreates them.
  * `history_triggers.sql` contains the triggers and functions used to make historical logging records for specific tables. Upon running, it purges all the logging triggers and functions and recreates them. Note that these used to be in the migrations and would have been generated by the Python script found in `/data/utilities/scripts`; this replaces that pattern.
  * `permissions.sql` handles granting specific permissions to standard roles on the database.
  * `utility_views.sql` drops and creates a set of utility views used for database administration. It drops views starting with `vw_util_*` and recreates them.
* `constants.ts` stores constants for use throughout the codebase. Magic strings that are used repeatedly should be made into constants with a consistent definition found here.
* `customScalarResolvers.ts` is code for custom scalars used in the application.
* `dateUtilities.ts` is a module of some basic date handling functions.
* `local-server.ts` runs Apollo Server and hosts the API. This version is strictly for local / development use, as the actual deployed version is found in `server.ts`. They are different files due to the launch configuration requirements for AWS Lambda.
* `log.ts` is the logger.
* `prismaClient.ts` is where the Prisma client instantiation is defined. You will import and use this in all your resolvers to access the Prisma models.
* `refreshDbObjects.ts` is the script which runs the files found in `sql/`. This is accessible via `npm run dbrefresh` and is also run as a default part of `npm run seed:reset` and `npm run migrate:deploy`.
* `seeder.ts` is a script for seeding synthetic data into local / development databases. It also serves as a confirmation that your models are working as expected. You should add to or update the seeder for any model changes, to ensure that the data inserts as expected.
* `server.ts` is the deployment version of `local-server.ts`, suitable for using within AWS Lambda.
* `types.ts` allows for exporting the types used on the server so that the client can also use them. It is also where types used within the server code (for example, derived from constants) can be defined.

## Models and Resolvers

The `model/` folder contains Prisma models, their accompanying GraphQL schemas and resolvers, and Prisma migrations. In addition, the `graphql.ts` and `schema.prisma` files are found here as well.

`graphql.ts` imports the GraphQL schemas and resolvers from the different models, and then exposes them to the server via exporting `typeDefs` and `resolvers`. When you add a new set of models, you need to add them here to make them usable.

`schema.prisma` is a standard Prisma configuration file defining the data source and other build parameters. Also, any types that need to be defined within the database (e.g. `ENUM` types) should be added here.

In general, the `model/` folder is structured so that every folder is a single model, and that every model is associated to a single table in the database.

> There is a small caveat here: history tables. Some tables have trigger-based logging within the database, where all operations on that table insert a record into the corresponding history table. Those history tables are not exposed via GraphQL and are not interacted with via API. For tables that have history logging, we define the corresponding history table in the same folder as the model.

Models are named using PascalCase (for instance, `DocumentProcessingStep`). The folders and files containing the models are named in camelCase (e.g. `documentProcessingStep/documentProcessingStep.prisma`).

Each model folder will have at least one file, and possibly many files. For a hypothetical `DocumentProcessingStep` model, these might be:

* `documentProcessingStep.prisma`: The Prisma model representing the table itself in the database. This is where columns and relations are defined.
* `documentProcessingStepHistory.prisma`: This is the history table specification.
* `documentProcessingStepResolvers.ts`: These are the GraphQL resolvers relating to this model.
  * Note that for more complex areas of the codebase, there may be numerous TypeScript files (see for instance `applicationDate` and `applicationPhase`).
* `documentProcessingStepSchema.ts`: This is the GraphQL schema for the model. This file is linted via the custom rules found in `/server/eslint-rules` to ensure that the TypeScript and GraphQL types in this file match.

If a model has a `Resolvers.ts` file, it generally should also have a `Schema.ts` file.

# Standards and Conventions

This section covers coding / design standards and conventions. These are not intended to be iron-clad rules, but instead, to give general guidance about expectations. If you have questions or think something should deviate from these standards, bring it up! The goal is to provide a set of guidance that covers 80-90% of the day-to-day scenarios encountered, not to completely limit flexibility in favor of standardization.

## Distinguishing Between Prisma Client Types and GQL Types

In some contexts, it's useful to use the type automatically generated by Prisma when working on a function. Often, this manifests as something like `import { Demonstration } from "@prisma/client";`. Sometimes, this could cause confusion with our own defined type, which might be imported like `import { Demonstration } from "../../types.js";`. To help to make the code more clear, alias the imports from the Prisma client with `Prisma` - e.g., `import { Demonstration as PrismaDemonstration } from "@prisma/client";`.

Note that you should import `PrismaApplication` from the `applicationResolvers.ts` file, not by aliasing it from `@prisma/client`, unless you _specifically_ want the two-column `application` table. Most likely, you want the union of `PrismaDemonstraton`, `PrismaAmendment`, and `PrismaExtension`, which is what is done in `applicationResolvers.ts`.

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
* `TYPE_LIMITER`:
  * Meaning: This table exists entirely to constrain the type of records in another table. It will have similar attributes to a static constraint. If this is present, no other flags should be used.
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

Putting these here, and then adding an empty line, means that they will be formatted as a single block when you run `npx prisma format`. It also helps to distinguish between the part of the Prisma file that contains strictly column definitions, from the section containing the relation fields.

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

The `authors` relation field tells us that there is a list of `User` objects associated with this. You'll note that there's no connection information here. In Prisma, a relation field must be present on _both ends_ of the relationship. In this context, this probably means that there's a constraint elsewhere in the database to a join table. Fortunately, `npx prisma format` automatically adds in the other end of relationships in case you forget to do so. Just be sure to fix the names, as by default, `npx prisma format` adds them in using PascalCase and not camelCase.

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
* Note that for inputs, we accept a specific `primaryReviewerUserId`; however, for the actual `Proposal` type, the field is `primaryReviewer` and has the type `User`. This is expected; the type shows the nested nature of the object, while the inputs accept specific IDs for use in the resolver code.
  * In general, you will use the "relational field" names and types from Prisma on the object type, and the "scalar field" names and types on the inputs.
  * The exception for this is cases where a relational field exists to a static constraint table. In those cases, you can use the relational field name throughout, since the intent of the static constraint table is to simply constrain the display value.
* Human-readable ID fields should be given the GraphQL type of `String`, while synthetic / meaningless keys (i.e. UUIDs) should be given the type of `ID`. This is consistent with [GraphQL documentation](https://graphql.org/learn/schema/):

  > ID: A unique identifier, often used to refetch an object or as the key for a cache. The ID type is serialized in the same way as a String; however, defining it as an ID signifies that it is not intended to be human‐readable.

  Within TypeScript, both are `string` types, since GraphQL treats the `ID` type as a string under the hood.
* As described [below](#static-constraint-types), use custom types for static constraint tables.

### Static Constraint Types

In cases where a field is constrained by a static constraint table, you should create a type to denote this in both GraphQL and TypeScript. There's code in `customScalarResolvers.ts` to enable this to happen dynamically from the constants. Using these as custom scalars means that there is validation on input that the string coming in is in the acceptable set of values. Take a look at `documentType` for an example of how this is done.

## Resolver Standards and Conventions

Every object should have a resolver and schema definition which provides for the following:

* [Queries](#queries)
* [Mutators](#mutators)
* [Field Resolvers](#field-resolvers) (if relevant)
* [Type Resolvers](#type-resolvers) (if relevant)

Generally, resolvers are placed in the same folder as the model to which they are related, as described in [Structure](#structure). Some judgement may be needed in deciding where to place code.

### Field Naming

As shown in the schema section, resolvers are named using camelCase, as are the fields (just like the Prisma models). The types are named via PascalCase, again, consistent with the actual names of the Prisma models.

### Queries

An object will most likely have two queries: one to retrieve a single item, and one to retrieve a list of items (possibly with some filtering). Do not prefix these with `get` or something similar; by definition, they are already `Query` actions in GraphQL, so getting things is implied. Instead, simply refer to the queries as the singular and plural names of the object. For instance, a proposal object should have `proposal` and `proposals` queries.

The singular query should look up the entity by its ID unless there is compelling reason to use another identifier. Be cautious with adding filtering to the list query. In general, if filtering is needed, it should be accomplished by retrieving the item from the resolver associated with the specific object being used for filtering. Using our Proposal item above, if proposals are connected to authors, you wouldn't want to add a `proposalsByAuthor` query. Instead, you would retrieve the relevant author and then get the `proposals` object from its field resolvers.

Note that it's acceptable to have fields in a query / return type that are not one-to-one matches to the database. Ideally, we will harmonize the names of the Prisma relation fields with the GraphQL models, but there may be instances where this makes less sense - the API may not need to use names with as much precision as is useful in the database. As long as this is properly documented, there are no issues. Similarly, there may be times when a constructed field is needed in a query response (for instance, if a query has a key that may return different types, it can be useful to denote what type of thing is being returned at the top level).

### Mutators

Mutators are named using a fairly standard syntax, but with flexibility. In general, the naming conventions are a guideline to try and aim for consistency, with the understanding that some cases may call for going outside these general guidelines.

| Mutator | Meaning | Notes | Arguments |
|---------|---------|-------|-----------|
| `createX` | Create a new instance of X. | Generally, a `create` mutator is used for operations that insert into tables that have a single ID column, like demonstrations, as opposed to associative tables with multiple columns. | Generally, this mutator should accept a single argument `input` which contains all the required and optional fields necessary to create a new record. |
| `updateX` | Update an instance of X that was created using a `create` mutator. | Like the `create` mutator, this focuses on top-level tables that have a single identifer, rather than composite / join tables. | Generally, the mutator should accept an `id` argument to identify the row to update, and an `input` argument with the updated values. The `input` object should generally have all values as optional. |
| `deleteXs` | Delete one or more Xs that were created using a `create` mutator. | Generally, `delete` mutators should accept multiple IDs unless there is a reason not to do this. | Usually, this will accept a list of `ids` to delete. |
| `setXYZ` | Create or update a record in an associative table, where XYZ describes the operation occurring. | The title should be descriptive of what occurs. For instance, `setDemonstrationRole` or `setDemonstrationContact` might be the name of a method that creates or updates a contact record for a user on a demonstration. | The arguments to these mutators should depend on the operation being performed. |
| `unsetXYZ` | Remove a record in an associative table, where XYZ describes the operation occurring. This is the inverse of the `setXYZ` mutator. | For example, `unsetDemonstrationRole` or `unsetDemonstrationContact` may remove those associations. | Again, the arguments should be specific to the use case. |

The phrase `set` was chosen over `add` to help denote that these operations are upserts (create or update). `unset` is intended to be the obvious opposite of `set`.

A few general rules that apply here are outlined below.

__Not All Mutators Are Required.__ You do not need to implement every possible combination of mutator for every object. The required mutators should be defined as part of the requirements. Without this, the amount of possible routes and combinations of queries rapidly become untenable.

__Associate Tables using Set/Unset.__ The `create`, `update`, and `delete` mutators are intended for records that represent independent entities, not for associating two entities together. For instance, we would not have a mutator called `createUserRoleAssignment`, even though it is necessary to assign users to roles, because such assignments are just associatons between the higher-level `User` and `Role` entities. The `set` and `unset` mutators are designed to be flexibly named to support those types of associations, with `set` explicitly being intended for upsert operations as well.

__Provide A Limited Set of Paths.__ It is not necessary to define mutators to perform operations in every possible direction, or in every possible operation. For instance, it's not necessary to define a mutator to create a new demonstration which allows you to assign contacts to the demonstration at the same time, and to also define a mutator to create and update new contact assignments.

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
4. __Static Constraint Tables__: As described [above](#static-constraints-tables-vs-enums), a static constraint table should be used in favor of an `enum` in most cases. Such contraint tables will have a single column, `id`, which contains the valid values. Denote these tables with the `STATIC_CONSTRAINT` flag on their Prisma models. Static constraint tables should not have history tables, nor will they have resolvers; they are intended to implement an `enum`-like functionality.
5. __Foreign Keys__: When using a column in a table that references the ID column of another table, refer to it with a prefix. Ideally, you should simply use `table_name_id`. In some contexts, it is necessary to add additional context about the meaning of a column. For instance, the primary reviewer of a proposal is a user, but naming the column `user_id` is ambiguous. In those contexts, you can use the format of `meaningful_name_type_id`. So, `primary_reviewer_user_id` indicates the the column is the primary reviewer and that it is a user ID, meaning it can be looked up in `users.id`.
6. __Relation Exposure (API & DB)__:: When using a table with an `FK_id` inside in the structure, e.g. `Event.application_id` or `Demonstration.application_type_id`, we set up the schema and resolvers to return the Object `Event.Application` instead of the `Event.application_id`. If we consistently do this, returing the 1 to 1 relationship instead of the ID, we can maintain parity across the system.
```TS
  export interface Event {
    id: string;
    // .. etc etc ..
    application?: Application;
  }
  ```
7. __History Table Specifics__: Every history table should begein with three columns: `revision_id`, `revision_type`, and `modified_at`. These are expected by the standard format of the logging triggers. Every other column should be reproduced from the source table, but no constraints or checks should be duplicated.

# How To Guides

## Getting Started

The easiest path is using the `devcontainer` setup as documented in the [Main Readme](../README.md#environment). Once you are inside the container, for the first run, you'll want to seed the database with fake data and then run the server.

```zsh
cd server
npm install
npm run seed:reset
npm run watch
```

Alternatively. If you prefer to run prisma and the local code separately.
You can use same top three instructions
```zsh
cd server
npm install
npm run seed:reset
```
Then run this to separate prisma and the code in separate shell sessions.
```zsh
npm run dev
npm run prisma
```

You may run the seeder as much as you like. Note that `npm run seed:reset` both rebuilds the DB schemas from the ground up, and then loads data into them. If you just want to drop and reload data (for instance, to check that history tracking is working), you can use `npm run seed` to just run that portion.

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

There is a second local stack script located under `lambdas/fileprocess/setup.sh`  It setups up the S3 buckets for upload and the clean bucket.

## Prisma Migrations

Prisma has a robust system which detects drift between the current state of the database and the Prisma models, and can generate SQL migration files to address this drift automatically. All of this functionality falls under the `npx prisma migrate` command.

Note that all of the commands here are appropriate when working in the devcontainer against the local development instance of PostgreSQL. You should verify that your `.env` file has you pointed to the local development DB before doing any of this - if you use the provided version, this should be true, but it's always good to check!

* `npx prisma migrate reset` drops the database and runs all the migrations found in the `migrations/` folder. You can use the `--force` flag to skip the confirmation dialogue. Oftentimes, you will have to do a `npx prisma migrate reset` when making changes to models; Prisma will prompt you at the terminal to do so. This is generally because the changes needed are not possible without dropping and recreating the data.
* `npx prisma migrate dev` is a complex command, as it is responsible for both generating new migrations and running them, which is not intuitive. (See also [this discussion](https://github.com/prisma/prisma/issues/11184) about the issues with this command.) When you run `npx prisma migrate dev`, it will try to generate a new migration in the `migrations/` folder that implements the changes to the models since the last migration.
  * If it is not possible to generate this automatically (for instance, if you need to change the type on a field that already exists, or drop a field that has data in it), Prisma will warn instead. You can use `--create-only` on this command to generate the SQL but not run it - this allows you to go edit in necessary code changes like dropping records, etc, in the SQL. Once you have the SQL the way you want, you can use `npx prisma migrate dev` to run it, though a `npx prisma migrate reset` may be necessary.
  * Note that if you generate a new migration, make additional model changes, and then run `primsa migrate dev` again, by default it will create a new migration, not update the previous one you made. If you are trying to keep your changes contained into a single migration per PR (which is usually a good idea), you will need to delete the previous migration before running `npx prisma migrate dev` again.
  * Keep in mind that if you change a table, you need to change the corresponding history table and the related trigger and function found in `sql/history_triggers.sql`. This used to be accomplished via a Python script found in `/data/utilities/scripts`, but now that the triggers are stored in a static file, you should just edit `history_triggers.sql`.

An important point: ___read the SQL that is generated by your model changes and make sure it makes sense.___ At the end of the day, the migration SQL is what gets run to bring the database into the state desired. While Prisma is pretty good, there have been a few places where it generated seemingly unusual items (a constraint that set the field to `NULL` on delete, when the field is `NOT NULL`, for instance). Prisma gets almost everything right, but be sure to at least skim what is generated.
