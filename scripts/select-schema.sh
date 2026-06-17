#!/usr/bin/env bash
# Switches Prisma schema provider based on DATABASE_URL.
#
# - If DATABASE_URL starts with "file:" or "postgres://localhost" or contains "sqlite",
#   uses SQLite schema (for local dev).
# - Otherwise (postgres://, postgresql:// pointing to remote like Neon/Supabase/Vercel),
#   uses PostgreSQL schema (for production).
#
# After selecting, runs `prisma generate` (and optionally `prisma db push`).

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SCHEMA_DIR="$PROJECT_DIR/prisma"
MAIN_SCHEMA="$SCHEMA_DIR/schema.prisma"
SQLITE_SCHEMA="$SCHEMA_DIR/schema.sqlite.prisma"
POSTGRES_SCHEMA="$SCHEMA_DIR/schema.postgres.prisma"

DB_URL="${DATABASE_URL:-}"

if [[ -z "$DB_URL" ]]; then
  echo "❌ DATABASE_URL is not set. Please set it in .env"
  exit 1
fi

# Detect provider
if [[ "$DB_URL" == file:* ]] || [[ "$DB_URL" == *sqlite* ]] || [[ "$DB_URL" == *localhost* ]]; then
  echo "📦 Detected SQLite (local dev) — using schema.sqlite.prisma"
  cp "$SQLITE_SCHEMA" "$MAIN_SCHEMA"
  PROVIDER="sqlite"
else
  echo "🐘 Detected PostgreSQL (production) — using schema.postgres.prisma"
  cp "$POSTGRES_SCHEMA" "$MAIN_SCHEMA"
  PROVIDER="postgresql"
fi

cd "$PROJECT_DIR"

# Always regenerate Prisma client
echo "🔧 Running prisma generate..."
bunx prisma generate

# If PUSH=1, also push schema to DB
if [[ "${PUSH:-0}" == "1" ]]; then
  echo "🚀 Running prisma db push..."
  bunx prisma db push
fi

echo "✅ Done. Provider: $PROVIDER"
