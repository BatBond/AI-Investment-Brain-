/**
 * Schema selector — picks SQLite or PostgreSQL Prisma schema based on DATABASE_URL.
 *
 * Why this exists: Prisma doesn't allow `provider = env("DB_PROVIDER")` in the schema.
 * So we keep two schema files (sqlite / postgres) and copy the right one into place
 * at build time based on the DATABASE_URL env var.
 *
 * Runs via: `node scripts/select-schema.js` (cross-platform, no bash required).
 * Invoked from package.json's `postinstall` and `build` scripts.
 */

const fs = require("fs");
const path = require("path");

const projectDir = path.resolve(__dirname, "..");
const schemaDir = path.join(projectDir, "prisma");
const mainSchema = path.join(schemaDir, "schema.prisma");
const sqliteSchema = path.join(schemaDir, "schema.sqlite.prisma");
const postgresSchema = path.join(schemaDir, "schema.postgres.prisma");

// Write the SQLite schema inline since we deleted the file
const SQLITE_SCHEMA = `// Prisma schema — SQLite variant (local dev)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Note {
  id          String   @id @default(cuid())
  title       String
  content     String   @default("")
  tags        String   @default("[]")
  tickerRefs  String   @default("[]")
  links       String   @default("[]")
  pinned      Boolean  @default(false)
  date        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  versions    NoteVersion[]
  @@index([title])
  @@index([updatedAt])
}

model NoteVersion {
  id        String   @id @default(cuid())
  noteId    String
  content   String
  title     String
  createdAt DateTime @default(now())
  note      Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)
  @@index([noteId, createdAt])
}

model ScheduledEmail {
  id            String   @id @default(cuid())
  name          String
  recipient     String
  subject       String
  template      String   @default("custom")
  cronExpr      String   @default("0 8 * * *")
  ticker        String?
  portfolioJson String?
  enabled       Boolean  @default(true)
  lastRunAt     DateTime?
  nextRunAt     DateTime?
  lastStatus    String?
  lastError     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@index([enabled, nextRunAt])
}

model EmailLog {
  id            String   @id @default(cuid())
  scheduledEmailId String?
  recipient     String
  subject       String
  body          String
  status        String
  error         String?
  sentAt        DateTime @default(now())
  @@index([sentAt])
  @@index([scheduledEmailId])
}

model PortfolioPosition {
  id              String   @id @default(cuid())
  symbol          String   @unique
  description     String
  quantity        Float
  avgCostBasis    Float
  costBasisTotal  Float
  type            String   @default("Cash")
  source          String   @default("manual")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([symbol])
}

model WatchlistItem {
  id              String   @id @default(cuid())
  symbol          String   @unique
  name            String?
  notes           String?
  addedAt         DateTime @default(now())
  @@index([symbol])
}

model SentimentArticle {
  id              String   @id @default(cuid())
  ticker          String
  source          String
  title           String
  url             String   @unique
  summary         String?
  sentiment       String   @default("neutral")
  sentimentScore  Float    @default(0)
  publishedAt     DateTime?
  fetchedAt       DateTime @default(now())
  @@index([ticker, fetchedAt])
  @@index([source])
}
`;

// Write the PostgreSQL schema inline
const POSTGRES_SCHEMA = SQLITE_SCHEMA.replace(
  'provider = "sqlite"',
  'provider = "postgresql"'
);

const dbUrl = process.env.DATABASE_URL || "";

// On Vercel, ALWAYS use PostgreSQL (SQLite doesn't work on serverless).
// Vercel sets process.env.VERCEL=1 and process.env.CI=1 during builds.
// This check happens BEFORE the DATABASE_URL check because Vercel's
// postinstall step may not have DATABASE_URL available yet, but VERCEL is set.
if (process.env.VERCEL === "1" || process.env.CI === "1") {
  console.log("🚀 Detected Vercel/CI environment — forcing PostgreSQL schema");
  fs.writeFileSync(mainSchema, POSTGRES_SCHEMA);
  console.log('✅ Wrote prisma/schema.prisma with provider="postgresql" (Vercel/CI override)');
  process.exit(0);
}

// Fallback to SQLite if DATABASE_URL is not set (local dev without .env).
// This is safe because prisma generate doesn't connect to the DB — it just
// generates client code based on the schema.
if (!dbUrl) {
  console.log("⚠️  DATABASE_URL not set — defaulting to SQLite for prisma generate");
  console.log("    (The build step will re-run this script with the real DATABASE_URL)");
  fs.writeFileSync(mainSchema, SQLITE_SCHEMA);
  console.log('✅ Wrote prisma/schema.prisma with provider="sqlite" (fallback)');
  process.exit(0);
}

let provider;
let schemaContent;

// Detect: file:* or sqlite or localhost → sqlite; everything else → postgresql
if (
  dbUrl.startsWith("file:") ||
  dbUrl.includes("sqlite") ||
  dbUrl.includes("localhost")
) {
  provider = "sqlite";
  schemaContent = SQLITE_SCHEMA;
  console.log("📦 Detected SQLite (local dev) — using SQLite schema");
} else {
  provider = "postgresql";
  schemaContent = POSTGRES_SCHEMA;
  console.log("🐘 Detected PostgreSQL (production) — using PostgreSQL schema");
}

fs.writeFileSync(mainSchema, schemaContent);
console.log(`✅ Wrote prisma/schema.prisma with provider="${provider}"`);
