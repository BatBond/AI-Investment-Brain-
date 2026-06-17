// Seed portfolio from uploaded xlsx into Prisma
const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function main() {
  const wb = XLSX.readFile('/home/z/my-project/upload/Portfolio_Positions_Jun-17-2026.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  // Skip header row 0
  const positions = rows.slice(1).filter(r => r[0] && r[2] > 0).map(r => ({
    symbol: String(r[0]).toUpperCase(),
    description: String(r[1] || r[0]),
    quantity: parseFloat(r[2]) || 0,
    lastPrice: parseFloat(r[3]) || 0,
    costBasisTotal: parseFloat(r[11]) || 0,
    avgCostBasis: parseFloat(r[12]) || (parseFloat(r[11]) / (parseFloat(r[2]) || 1)),
    type: String(r[13] || 'Cash'),
  }));

  console.log(`Seeding ${positions.length} positions...`);
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
  console.log(`\n✅ Seeded ${count} positions.`);

  // Also add a few default watchlist items
  const watchlist = ['SPY', 'QQQ', 'IWM', 'VIX', 'DIA'];
  for (const sym of watchlist) {
    await db.watchlistItem.upsert({
      where: { symbol: sym },
      create: { symbol: sym, name: sym, notes: 'Auto-added index tracker' },
      update: {},
    });
  }
  console.log(`✅ Seeded ${watchlist.length} default watchlist items.`);

  // Total cost basis
  const total = positions.reduce((s, p) => s + p.costBasisTotal, 0);
  console.log(`\n📊 Total cost basis: $${total.toFixed(2)}`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
