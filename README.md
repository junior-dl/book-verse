# Nuxt BookVerse

Digital Library

## Setup

Make sure to install dependencies:

```bash
# pnpm
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

## Production

Build the application for production:

```bash
pnpm build
```

Locally preview production build:

```bash
pnpm preview
```

## Drizzle ORM

Pull existing tables from database:

```bash
pnpm drizzle-kit pull
```

Generate updates on schema to migration files:

```bash
pnpm drizzle-kit generate
```

Push generated migrations to the database:

```bash
pnpm drizzle-kit migrate
```

Push updates to schema to database (bypass migrations):

```bash
pnpm drizzle-kit push
```

Open drizzle studio:

```bash
pnpm drizzle-kit studio
```
