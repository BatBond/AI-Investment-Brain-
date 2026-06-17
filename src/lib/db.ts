import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Lazily instantiate PrismaClient. Wrapped in try/catch because the Prisma
// client may not be generated yet (e.g., during early build steps), or the
// DATABASE_URL may not be reachable. The db object is only actually used
// inside API routes that have their own try/catch, so a null db here just
// means API calls return 500 instead of crashing the whole app.
let _db: PrismaClient | null = null;
try {
  _db =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: ['error', 'warn'],
    })
  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db as PrismaClient
} catch (e) {
  console.error('[db] Failed to initialize Prisma client:', e instanceof Error ? e.message : String(e))
  _db = null
}

// Export as non-null for backwards compatibility — callers should handle errors
// gracefully. If _db is null, queries will throw "Cannot read properties of null"
// which is caught by API route try/catch blocks.
export const db = _db as PrismaClient