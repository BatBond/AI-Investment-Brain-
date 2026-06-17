// Quick WebSocket client test
import { io } from 'socket.io-client'

const socket = io('http://localhost:3030/', { path: '/' })

socket.on('connect', () => {
  console.log('✅ Connected to portfolio stream, id:', socket.id)
})

socket.on('portfolio-update', (update) => {
  console.log('📊 Received portfolio update at', new Date(update.timestamp).toISOString())
  console.log('   Totals:')
  console.log('     Cost basis:  $' + update.totals.costBasis.toFixed(2))
  console.log('     Market val:  $' + update.totals.marketValue.toFixed(2))
  console.log('     Today P&L:   $' + update.totals.todayPnl.toFixed(2) + ' (' + update.totals.todayPnlPct.toFixed(2) + '%)')
  console.log('     Total P&L:   $' + update.totals.totalPnl.toFixed(2) + ' (' + update.totals.totalPnlPct.toFixed(2) + '%)')
  console.log('     Live/Total:  ' + update.totals.liveCount + '/' + update.totals.totalCount)
  console.log('   Top 3 positions by market value:')
  const sorted = [...update.positions].sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0)).slice(0, 3)
  sorted.forEach(p => {
    console.log('     ' + p.symbol + ': $' + (p.marketValue || 0).toFixed(2) + ' (' + (p.totalPnlPct || 0).toFixed(2) + '% total, ' + (p.todayPnlPct || 0).toFixed(2) + '% today)')
  })
  socket.disconnect()
  process.exit(0)
})

socket.on('connect_error', (e) => {
  console.error('❌ Connect error:', e.message)
  process.exit(1)
})

setTimeout(() => {
  console.error('⏰ Timeout waiting for portfolio-update')
  process.exit(1)
}, 15000)
