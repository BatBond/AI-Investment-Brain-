/**
 * Seed portfolio to a PRODUCTION PostgreSQL database (Vercel + Neon/Supabase).
 *
 * Usage:
 *   DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" node scripts/seed-portfolio-prod.js
 *
 * This is the same as scripts/seed_portfolio.js but uses the PostgreSQL schema
 * explicitly so it works against a remote Postgres DB without needing the
 * select-schema.js script to run first.
 */

const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set.');
    console.error('   Usage: DATABASE_URL="postgresql://..." node scripts/seed-portfolio-prod.js');
    process.exit(1);
  }
  if (!dbUrl.startsWith('postgres')) {
    console.error('❌ DATABASE_URL must be a PostgreSQL connection string.');
    console.error('   Got:', dbUrl.slice(0, 50) + '...');
    console.error('   For local SQLite seeding, use: node scripts/seed_portfolio.js');
    process.exit(1);
  }

  console.log('🔌 Connecting to PostgreSQL at:', dbUrl.replace(/:[^:@]+@/, ':****@'));
  const db = new PrismaClient({ log: ['error', 'warn'] });

  try {
    // Test connection
    await db.$queryRaw`SELECT 1`;
    console.log('✅ Database connection OK');

    // Check if tables exist
    const tables = await db.$queryRaw`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📊 Tables in database:', tables.map(t => t.table_name).join(', '));

    const hasPortfolio = tables.some(t => t.table_name === 'PortfolioPosition');
    if (!hasPortfolio) {
      console.error('');
      console.error('❌ PortfolioPosition table does not exist!');
      console.error('   Run schema push first:');
      console.error('   DATABASE_URL="' + dbUrl + '" bunx prisma db push');
      process.exit(1);
    }

    // Read xlsx
    const xlsxPath = process.argv[2] || './upload/Portfolio_Positions_Jun-17-2026.xlsx';
    console.log('');
    console.log('📖 Reading xlsx:', xlsxPath);
    const wb = XLSX.readFile(xlsxPath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const positions = rows.slice(1).filter(r => r[0] && r[2] > 0).map(r => ({
      symbol: String(r[0]).toUpperCase(),
      description: String(r[1] || r[0]),
      quantity: parseFloat(r[2]) || 0,
      costBasisTotal: parseFloat(r[11]) || 0,
      avgCostBasis: parseFloat(r[12]) || (parseFloat(r[11]) / (parseFloat(r[2]) || 1)),
      type: String(r[13] || 'Cash'),
    }));

    console.log(`🌱 Seeding ${positions.length} positions...`);
    let count = 0;
    for (const p of positions) {
      await db.portfolioPosition.upsert({
        where: { symbol: p.symbol },
        create: {
          symbol: p.symbol,
          description: p.description,
          quantity: p.quantity,
          avgCostBasis: p.avgCostBasis,
          costBasisTotal: p.costBasisTotal,
          type: p.type,
          source: 'imported',
        },
        update: {
          description: p.description,
          quantity: p.quantity,
          avgCostBasis: p.avgCostBasis,
          costBasisTotal: p.costBasisTotal,
          type: p.type,
        },
      });
      count++;
      console.log(`  [${count}] ${p.symbol} — qty ${p.quantity} @ avg $${p.avgCostBasis.toFixed(2)}`);
    }
    console.log('');
    console.log(`✅ Seeded ${count} positions to production database.`);

    // Also seed default watchlist if empty
    const existingWatchlist = await db.watchlistItem.count();
    if (existingWatchlist === 0) {
      const watchlist = ['SPY', 'QQQ', 'IWM', 'VIX', 'DIA'];
      for (const sym of watchlist) {
        await db.watchlistItem.create({
          data: { symbol: sym, name: sym, notes: 'Auto-added index tracker' },
        });
      }
      console.log(`✅ Seeded ${watchlist.length} default watchlist items.`);
    } else {
      console.log(`📋 Watchlist already has ${existingWatchlist} items, skipping.`);
    }

    // Summary
    const total = positions.reduce((s, p) => s + p.costBasisTotal, 0);
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Total positions: ${count}`);
    console.log(`   Total cost basis: $${total.toFixed(2)}`);
    console.log(`   Database URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`);
    console.log('');
    console.log('🎉 Production portfolio seeded! Visit your Vercel URL and check the Portfolio tab.');

  } catch (e) {
    console.error('');
    console.error('❌ Failed:', e.message);
    if (e.code === 'P1003') {
      console.error('');
      console.error('   Database schema not pushed. Run:');
      console.error('   DATABASE_URL="' + process.env.DATABASE_URL + '" bunx prisma db push');
    }
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
