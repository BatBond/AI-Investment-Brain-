/**
 * Portfolio Streaming Mini-Service
 *
 * WebSocket server on port 3030 that broadcasts real-time portfolio P&L updates.
 * Polls Yahoo Finance for live quotes every 2 seconds and pushes computed P&L to all connected clients.
 *
 * Client connects via: io("/?XTransformPort=3030")
 * Server emits: "portfolio-update" event with { positions, totals, timestamp }
 */

import { createServer } from 'http'
import { Server } from 'socket.io'
import YahooFinance from 'yahoo-finance2'
import { PrismaClient } from '@prisma/client'

const PORT = 3030
const POLL_INTERVAL_MS = 2000  // 2 seconds (Yahoo's effective refresh rate; "millisecond" feel via smooth client-side interpolation)
const CACHE_TTL_MS = 1500      // dedup Yahoo calls within this window

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] })
const db = new PrismaClient()

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// ── Quote cache (symbol → { data, ts }) ───────────────────────────────
const quoteCache = new Map<string, { data: any; ts: number }>()

async function getCachedQuote(symbol: string): Promise<any | null> {
  const now = Date.now()
  const cached = quoteCache.get(symbol)
  if (cached && now - cached.ts < CACHE_TTL_MS) return cached.data
  try {
    const q = await yf.quote(symbol)
    quoteCache.set(symbol, { data: q, ts: now })
    return q
  } catch (e: any) {
    console.error(`[quote] ${symbol} failed:`, e.message)
    return cached?.data || null  // return stale cache if Yahoo fails
  }
}

// ── Portfolio snapshot builder ───────────────────────────────────────
interface PositionUpdate {
  symbol: string
  description: string
  quantity: number
  avgCostBasis: number
  costBasisTotal: number
  type: string
  // Live data
  livePrice: number | null
  previousClose: number | null
  changeAbs: number | null
  changePct: number | null
  marketValue: number | null
  todayPnl: number | null
  todayPnlPct: number | null
  totalPnl: number | null
  totalPnlPct: number | null
  percentOfAccount: number | null
  dayVolume: number | null
  isLive: boolean
}

interface PortfolioUpdate {
  positions: PositionUpdate[]
  totals: {
    costBasis: number
    marketValue: number
    todayPnl: number
    todayPnlPct: number
    totalPnl: number
    totalPnlPct: number
    liveCount: number
    totalCount: number
  }
  timestamp: number
}

async function buildPortfolioUpdate(): Promise<PortfolioUpdate> {
  const positions = await db.portfolioPosition.findMany({ orderBy: { symbol: 'asc' } })

  // Fetch quotes in parallel (batch of 5 to avoid rate limits)
  const quotes: Record<string, any | null> = {}
  const batchSize = 5
  for (let i = 0; i < positions.length; i += batchSize) {
    const batch = positions.slice(i, i + batchSize)
    const results = await Promise.all(batch.map(p => getCachedQuote(p.symbol)))
    batch.forEach((p, idx) => { quotes[p.symbol] = results[idx] })
  }

  let totalCost = 0, totalMktVal = 0, totalTodayPnl = 0, totalTotalPnl = 0, liveCount = 0
  const updatePositions: PositionUpdate[] = positions.map(p => {
    const q = quotes[p.symbol]
    totalCost += p.costBasisTotal
    if (q) {
      liveCount++
      const livePrice = q.regularMarketPrice ?? 0
      const prevClose = q.regularMarketPreviousClose ?? livePrice
      const changeAbs = q.regularMarketChange ?? (livePrice - prevClose)
      const changePct = q.regularMarketChangePercent ?? (prevClose ? (livePrice - prevClose) / prevClose : 0)
      const marketValue = livePrice * p.quantity
      const todayPnl = changeAbs * p.quantity
      const todayPnlPct = prevClose ? todayPnl / (prevClose * p.quantity) : 0
      const totalPnl = marketValue - p.costBasisTotal
      const totalPnlPct = p.costBasisTotal ? totalPnl / p.costBasisTotal : 0
      totalMktVal += marketValue
      totalTodayPnl += todayPnl
      totalTotalPnl += totalPnl
      return {
        symbol: p.symbol, description: p.description, quantity: p.quantity,
        avgCostBasis: p.avgCostBasis, costBasisTotal: p.costBasisTotal, type: p.type,
        livePrice, previousClose: prevClose, changeAbs, changePct: changePct * 100,
        marketValue, todayPnl, todayPnlPct: todayPnlPct * 100,
        totalPnl, totalPnlPct: totalPnlPct * 100,
        percentOfAccount: null, // computed after totals
        dayVolume: q.regularMarketVolume ?? null,
        isLive: true,
      }
    }
    // Fallback to last known cost basis
    return {
      symbol: p.symbol, description: p.description, quantity: p.quantity,
      avgCostBasis: p.avgCostBasis, costBasisTotal: p.costBasisTotal, type: p.type,
      livePrice: p.avgCostBasis, previousClose: p.avgCostBasis, changeAbs: 0, changePct: 0,
      marketValue: p.costBasisTotal, todayPnl: 0, todayPnlPct: 0,
      totalPnl: 0, totalPnlPct: 0,
      percentOfAccount: null,
      dayVolume: null,
      isLive: false,
    }
  })

  // Compute percent of account
  updatePositions.forEach(p => {
    p.percentOfAccount = totalMktVal ? (p.marketValue! / totalMktVal) * 100 : 0
  })

  return {
    positions: updatePositions,
    totals: {
      costBasis: totalCost,
      marketValue: totalMktVal,
      todayPnl: totalTodayPnl,
      todayPnlPct: totalCost ? (totalTodayPnl / (totalMktVal - totalTodayPnl)) * 100 : 0,
      totalPnl: totalTotalPnl,
      totalPnlPct: totalCost ? (totalTotalPnl / totalCost) * 100 : 0,
      liveCount,
      totalCount: positions.length,
    },
    timestamp: Date.now(),
  }
}

// ── Connection handling ──────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[ws] Client connected: ${socket.id}`)

  // Send an immediate snapshot on connect
  buildPortfolioUpdate()
    .then(update => socket.emit('portfolio-update', update))
    .catch(e => console.error('[ws] initial snapshot failed:', e.message))

  socket.on('disconnect', () => {
    console.log(`[ws] Client disconnected: ${socket.id}`)
  })

  socket.on('refresh-now', () => {
    console.log(`[ws] Manual refresh requested by ${socket.id}`)
    buildPortfolioUpdate()
      .then(update => socket.emit('portfolio-update', update))
      .catch(e => console.error('[ws] manual refresh failed:', e.message))
  })
})

// ── Periodic broadcast to ALL clients ─────────────────────────────────
let broadcastTimer: NodeJS.Timeout | null = null
async function startBroadcasting() {
  if (broadcastTimer) return
  broadcastTimer = setInterval(async () => {
    const clientCount = io.engine.clientsCount
    if (clientCount === 0) return  // skip if no one's listening
    try {
      const update = await buildPortfolioUpdate()
      io.emit('portfolio-update', update)
    } catch (e: any) {
      console.error('[broadcast] failed:', e.message)
    }
  }, POLL_INTERVAL_MS)
}

startBroadcasting()

httpServer.listen(PORT, () => {
  console.log(`🚀 Portfolio stream WebSocket running on port ${PORT}`)
  console.log(`   Polling Yahoo Finance every ${POLL_INTERVAL_MS}ms`)
  console.log(`   Connect via: io("/?XTransformPort=${PORT}")`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...')
  if (broadcastTimer) clearInterval(broadcastTimer)
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...')
  if (broadcastTimer) clearInterval(broadcastTimer)
  httpServer.close(() => process.exit(0))
})
