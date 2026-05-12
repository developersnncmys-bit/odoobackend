// Application entry: load env, connect to Mongo, prepare counters,
// then start Express. No fixture seeding — data is created via the API.
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import { connectDb, disconnectDb } from './config/db.js'
import { initCounters } from './utils/ids.js'

import { notFound, errorHandler } from './middleware/errors.js'

// route modules
import leadsRouter         from './routes/leads.js'
import projectsRouter      from './routes/projects.js'
import proposalsRouter     from './routes/proposals.js'
import invoicesRouter      from './routes/invoices.js'
import calendarRouter      from './routes/calendar.js'
import documentsRouter     from './routes/documents.js'
import teamRouter          from './routes/team.js'
import notificationsRouter from './routes/notifications.js'
import dashboardRouter     from './routes/dashboard.js'
import metaRouter          from './routes/meta.js'

const PORT = Number(process.env.PORT) || 4000

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(morgan('dev'))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

app.use('/api/meta',          metaRouter)
app.use('/api/leads',         leadsRouter)
app.use('/api/projects',      projectsRouter)
app.use('/api/proposals',     proposalsRouter)
app.use('/api/invoices',      invoicesRouter)
app.use('/api/calendar',      calendarRouter)
app.use('/api/documents',     documentsRouter)
app.use('/api/team',          teamRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/dashboard',     dashboardRouter)

app.use(notFound)
app.use(errorHandler)

async function start() {
  await connectDb()
  await initCounters()

  const server = app.listen(PORT, () => {
    console.log(`\n  Absolute Concepts CRM API`)
    console.log(`  listening on http://localhost:${PORT}/api`)
    console.log(`  health      http://localhost:${PORT}/api/health\n`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[fatal] port ${PORT} is already in use.`)
      console.error(`  Stop the other process or set a different PORT in backend/.env\n`)
    } else {
      console.error('[fatal] server error:', err.message)
    }
    process.exit(1)
  })
}

// graceful shutdown
const close = async (sig) => {
  console.log(`\n[${sig}] shutting down…`)
  await disconnectDb()
  process.exit(0)
}
process.on('SIGINT',  () => close('SIGINT'))
process.on('SIGTERM', () => close('SIGTERM'))

start().catch(err => {
  console.error('\n[fatal] failed to start application')
  console.error(err)
  console.error(err?.message)
  console.error(err?.stack)
  process.exit(1)
})
