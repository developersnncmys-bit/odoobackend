// Leads — implements doc §4 (CRM lead management) + §15 (Lost) + §6 (win → project).
import { Lead, Project, CalendarEvent, Notification } from '../models/index.js'
import { HttpError } from '../middleware/async-handler.js'
import { nextId } from '../utils/ids.js'

const REQUIRED = ['clientName', 'contact', 'eventName', 'eventType', 'eventDate', 'venue']
function validateCreate(body) {
  const missing = REQUIRED.filter(f => !body[f] || String(body[f]).trim() === '')
  if (missing.length) throw new HttpError(400, 'Missing required fields', { missing })
  if (body.email && !/^\S+@\S+\.\S+$/.test(body.email)) {
    throw new HttpError(400, 'Invalid email')
  }
  if (body.probability != null && (body.probability < 0 || body.probability > 100)) {
    throw new HttpError(400, 'probability must be 0..100')
  }
}

/* ------------ Collection ------------ */

export async function list(req, res) {
  const { stage, category, source, owner, q } = req.query
  const filter = {}
  if (stage)    filter.stage    = stage
  if (category) filter.category = category
  if (source)   filter.source   = source
  if (owner)    filter.$or      = [{ bdOwner: owner }, { csOwner: owner }]
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$and = [{ $or: [{ clientName: rx }, { company: rx }, { eventName: rx }, { _id: rx }] }]
  }
  const leads = await Lead.find(filter).sort({ createdAt: -1, _id: -1 }).lean({ virtuals: false })
  res.json(leads.map(toApi))
}

export async function create(req, res) {
  validateCreate(req.body)
  const today = new Date().toISOString().slice(0, 10)
  const id = await nextId('leads')

  const lead = await Lead.create({
    _id: id,
    createdAt: today,
    activities: [
      { date: today, type: 'note', user: req.body.bdOwner || 'u1', text: 'Lead created via API.' },
    ],
    ...req.body,
    guestCount:      Number(req.body.guestCount      || 0),
    budget:          Number(req.body.budget          || 0),
    expectedRevenue: Number(req.body.expectedRevenue || 0),
    probability:     Number(req.body.probability     || 0),
  })
  res.status(201).json(lead.toJSON())
}

/**
 * POST /api/leads/bulk
 * Body: { leads: [ {clientName, ...}, ... ] }
 *
 * Per-row try/catch so a single bad row doesn't abort the whole import.
 * Returns { created: [...], failed: [{row, error, details, data}], total }.
 */
export async function bulkCreate(req, res) {
  const list = Array.isArray(req.body) ? req.body : req.body?.leads
  if (!Array.isArray(list) || list.length === 0) {
    throw new HttpError(400, '`leads` array is required')
  }
  if (list.length > 500) {
    throw new HttpError(400, 'Bulk import is capped at 500 rows per request')
  }

  const today  = new Date().toISOString().slice(0, 10)
  const created = []
  const failed  = []

  for (let i = 0; i < list.length; i++) {
    const row = list[i] || {}
    try {
      validateCreate(row)
      const id = await nextId('leads')
      const lead = await Lead.create({
        _id: id,
        createdAt: today,
        activities: [
          { date: today, type: 'note', user: row.bdOwner || 'u1', text: 'Lead created via bulk import.' },
        ],
        ...row,
        guestCount:      Number(row.guestCount      || 0),
        budget:          Number(row.budget          || 0),
        expectedRevenue: Number(row.expectedRevenue || 0),
        probability:     Number(row.probability     || 0),
      })
      created.push(lead.toJSON())
    } catch (err) {
      failed.push({
        row: i + 1,
        error: err.message,
        details: err.details,
        data: row,
      })
    }
  }

  res.status(201).json({ created, failed, total: list.length })
}

/* ------------ Single ------------ */

export async function get(req, res) {
  const lead = await Lead.findById(req.params.id)
  if (!lead) throw new HttpError(404, 'Lead not found')
  res.json(lead.toJSON())
}

export async function update(req, res) {
  const { id } = req.params
  const updates = { ...req.body }
  for (const f of ['guestCount', 'budget', 'expectedRevenue', 'probability']) {
    if (updates[f] != null) updates[f] = Number(updates[f])
  }
  const lead = await Lead.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
  if (!lead) throw new HttpError(404, 'Lead not found')
  res.json(lead.toJSON())
}

export async function remove(req, res) {
  const lead = await Lead.findByIdAndDelete(req.params.id)
  if (!lead) throw new HttpError(404, 'Lead not found')
  res.status(204).end()
}

/* ------------ Activity timeline ------------ */

export async function addActivity(req, res) {
  const { type = 'note', user = 'u1', text } = req.body
  if (!text || !String(text).trim()) throw new HttpError(400, 'text is required')

  const entry = { date: new Date().toISOString().slice(0, 10), type, user, text }
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    { $push: { activities: entry } },
    { new: true }
  )
  if (!lead) throw new HttpError(404, 'Lead not found')
  res.status(201).json(entry)
}

/* ------------ Workflow transitions (§3, §6, §15) ------------ */

export async function win(req, res) {
  const lead = await Lead.findById(req.params.id)
  if (!lead) throw new HttpError(404, 'Lead not found')

  // Idempotent: if already Won and project exists, return existing
  if (lead.stage === 'Won' && lead.projectId) {
    const existing = await Project.findById(lead.projectId)
    return res.json({ lead: lead.toJSON(), project: existing?.toJSON() || null, reused: true })
  }

  const today = new Date().toISOString().slice(0, 10)
  lead.stage = 'Won'
  lead.probability = 100
  lead.activities.push({
    date: today, type: 'note',
    user: req.body?.user || 'u1',
    text: 'Deal marked WON. Project auto-created.',
  })

  // Auto-create project per §6
  const projectId = await nextId('projects')
  const project = await Project.create({
    _id: projectId, leadId: lead._id,
    name: lead.eventName, client: lead.company || lead.clientName, category: lead.category,
    eventDate: lead.eventDate, setupDate: lead.setupDate, venue: lead.venue,
    budget: lead.expectedRevenue, spent: 0,
    status: 'Awaiting PO', stage: 'Pre-Event', progress: 0,
    csOwner: lead.csOwner,
    team: [lead.bdOwner, lead.csOwner].filter(Boolean),
  })

  lead.projectId = projectId
  await lead.save()

  // Auto-populate calendar (§6)
  if (lead.eventDate) {
    await CalendarEvent.create({
      _id: await nextId('calendarEvents'),
      title: `${lead.eventName} — EVENT DAY`,
      date: lead.eventDate, time: lead.eventTime || '10:00',
      type: 'event', projectId, dept: 'Production',
    })
  }
  if (lead.setupDate) {
    await CalendarEvent.create({
      _id: await nextId('calendarEvents'),
      title: `${lead.eventName} — SETUP`,
      date: lead.setupDate, time: lead.setupTime || '08:00',
      type: 'setup', projectId, dept: 'Production',
    })
  }

  // Notify accounts dept (§6, §13)
  await Notification.create({
    _id: await nextId('notifications'),
    text: `Project ${projectId} created from won lead ${lead._id} — accounts to invoice`,
    type: 'project',
  })

  res.status(201).json({ lead: lead.toJSON(), project: project.toJSON(), reused: false })
}

export async function lose(req, res) {
  const { reason } = req.body
  if (!reason || !String(reason).trim()) throw new HttpError(400, 'reason is required')

  const today = new Date().toISOString().slice(0, 10)
  const lead = await Lead.findByIdAndUpdate(
    req.params.id,
    {
      stage: 'Lost', probability: 0, expectedRevenue: 0, lostReason: reason,
      $push: {
        activities: { date: today, type: 'note', user: req.body?.user || 'u1', text: `Lead lost — ${reason}` },
      },
    },
    { new: true }
  )
  if (!lead) throw new HttpError(404, 'Lead not found')
  res.json(lead.toJSON())
}

export async function reopen(req, res) {
  const lead = await Lead.findById(req.params.id)
  if (!lead) throw new HttpError(404, 'Lead not found')
  if (lead.stage !== 'Lost') return res.json(lead.toJSON())

  lead.stage       = req.body?.stage || 'Contacted'
  lead.lostReason  = null
  lead.probability = req.body?.probability ?? 30
  lead.activities.push({
    date: new Date().toISOString().slice(0, 10),
    type: 'note', user: req.body?.user || 'u1',
    text: 'Lost lead reopened.',
  })
  await lead.save()
  res.json(lead.toJSON())
}

/* helper: lean() result has _id, needs same shape as toJSON */
function toApi(doc) {
  const { _id, ...rest } = doc
  return { id: _id, ...rest }
}
