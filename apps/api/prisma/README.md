# Prisma Setup And Migration Notes

This folder contains the Prisma schema, migration history, and seed script for the `apps/api` service.

## What Prisma Is Doing In This Project

- [schema.prisma](/c:/Users/sagar/Desktop/project-hub/apps/api/prisma/schema.prisma) defines the PostgreSQL models and enums.
- `migrations/` stores the generated SQL history that Prisma applies to the database.
- [seed.js](/c:/Users/sagar/Desktop/project-hub/apps/api/prisma/seed.js) inserts demo data after the schema is ready.

## Schema Evolution In This Repo

The current implementation moved in two clear steps:

1. `20260315185433_init`
   - Introduced the initial persistent PostgreSQL schema.
   - Added the `Project` table and `ProjectStatus` enum.
   - This is the point where the app moved from Day 2 in-memory project storage to Day 3 database-backed persistence.

2. `20260315192207_add_tickets_comments`
   - Expanded the schema to support `Ticket` and `Comment`.
   - Added enums for `TicketStatus` and `Priority`.
   - Added relations:
     - `Project -> Ticket` as one-to-many
     - `Ticket -> Comment` as one-to-many
   - Added indexes on `Ticket.projectId` and `Comment.ticketId`.

There is no data-copy migration from an older database in this repo. The main "migration of data" so far was architectural:

- Day 2: projects lived in memory inside the NestJS service and were lost on restart.
- Day 3 onward: data is stored in PostgreSQL through Prisma migrations, so records persist across restarts.

## Commands Used

Run these from [apps/api](/c:/Users/sagar/Desktop/project-hub/apps/api).

Install dependencies:

```powershell
pnpm install
```

Generate Prisma client from the current schema:

```powershell
pnpm prisma:generate
```

Apply migrations in development:

```powershell
pnpm prisma:migrate
```

The `pnpm prisma:migrate` script maps to:

```powershell
prisma migrate dev
```

If you want to create a new named migration explicitly, use:

```powershell
npx prisma migrate dev --name <migration_name>
```

Examples that match the history in this repo:

```powershell
npx prisma migrate dev --name init
npx prisma migrate dev --name add_tickets_comments
```

Seed the database with demo records:

```powershell
pnpm prisma:seed
```

Open Prisma Studio:

```powershell
pnpm prisma:studio
```

## Recommended Local Flow

1. Ensure `DATABASE_URL` is set in your API `.env`.
2. Run `pnpm prisma:migrate`.
3. Run `pnpm prisma:generate` if needed.
4. Run `pnpm prisma:seed` for demo data.
5. Start the API with `pnpm start:dev`.

## Current Database Shape

The current schema contains:

- `Project`
- `Ticket`
- `Comment`
- `ProjectStatus`
- `TicketStatus`
- `Priority`

The relationship model is:

```text
Project
  -> Ticket
    -> Comment
```

## Notes About The Seed Script

[seed.js](/c:/Users/sagar/Desktop/project-hub/apps/api/prisma/seed.js) currently:

- deletes existing comments, tickets, and projects
- creates 1 demo project
- creates 2 demo tickets
- creates 3 demo comments

This is useful for a clean demo dataset, but it is not a production-safe seed strategy because it resets existing data.
