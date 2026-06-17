import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Lazily instantiate PrismaClient. Wrapped in try/catch because:
// - Prisma client may not be generated yet during early build steps
// - DATABASE_URL may not be set or reachable on Vercel cold start
// - SQLite path may be wrong (Vercel serverless filesystem is read-only)
//
// The db object is only used inside API routes (which have their own
// try/catch), so a null db here just means API calls return 500 instead
// of crashing the whole app.
let _db: PrismaClient | null = null;
try {
  if (!process.env.DATABASE_URL) {
    console.warn('[db] DATABASE_URL not set — API routes will return 500')
  } else {
    _db =
      globalForPrisma.prisma ??
      new PrismaClient({
        log: ['error', 'warn'],
      })
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db as PrismaClient
  }
} catch (e) {
  console.error('[db] Failed to initialize Prisma client:', e instanceof Error ? e.message : String(e))
  _db = null
}

// Export as non-null for backwards compatibility — callers should handle errors
// gracefully. If _db is null, queries will throw "Cannot read properties of null"
// which is caught by API route try/catch blocks.
export const db = _db as PrismaClient