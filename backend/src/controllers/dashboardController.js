// Dashboard aggregates — doc §14 (sales, project, accounts, management).
import { Lead, Project, Invoice, CalendarEvent, Proposal, TeamMember } from '../models/index.js'
import { BUSINESS_CATEGORIES } from '../utils/constants.js'

export async function summary(_req, res) {
  const today = new Date().toISOString().slice(0, 10)

  // §14.1 sales
  const [totalLeads, won, lost] = await Promise.all([
    Lead.countDocuments({}),
    Lead.countDocuments({ stage: 'Won' }),
    Lead.countDocuments({ stage: 'Lost' }),
  ])
  const conversion = totalLeads ? Math.round((won / totalLeads) * 100) : 0
  const activeLeads = await Lead.find({ stage: { $nin: ['Won', 'Lost'] } })
    .select('expectedRevenue probability').lean()
  const weightedPipeline = activeLeads.reduce(
    (s, l) => s + (l.expectedRevenue * l.probability / 100), 0
  )

  // §14.2 project
  const [ongoingProjects, upcomingEvents, delayedAgg] = await Promise.all([
    Project.countDocuments({}),
    CalendarEvent.countDocuments({ date: { $gte: today }, type: { $in: ['event', 'setup'] } }),
    Project.aggregate([
      { $unwind: '$tasks' },
      { $match: { 'tasks.status': 'Delayed' } },
      { $count: 'n' },
    ]),
  ])
  const delayedTasks = delayedAgg[0]?.n || 0

  // §14.3 accounts
  const invoices = await Invoice.find({}).select('total gst status').lean()
  const totalBilled  = invoices.reduce((s, i) => s + i.total, 0)
  const paid         = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0)
  const outstanding  = totalBilled - paid
  const gstCollected = invoices.reduce((s, i) => s + i.gst, 0)
  const pendingInvoices = invoices.filter(i => i.status !== 'Paid').length

  // §14.4 management
  const wonLeads = await Lead.find({ stage: 'Won' }).select('expectedRevenue').lean()
  const wonRevenue = wonLeads.reduce((s, l) => s + l.expectedRevenue, 0)
  const proposalsInFlight = await Proposal.countDocuments({ status: { $ne: 'Approved' } })

  res.json({
    sales:      { totalLeads, won, lost, conversion, weightedPipeline },
    project:    { ongoingProjects, upcomingEvents, delayedTasks },
    accounts:   { totalBilled, paid, outstanding, gstCollected, pendingInvoices },
    management: { wonRevenue, proposalsInFlight },
  })
}

export async function leadSources(_req, res) {
  const agg = await Lead.aggregate([
    { $group: { _id: '$source', value: { $sum: 1 } } },
    { $project: { _id: 0, name: '$_id', value: 1 } },
    { $sort: { value: -1 } },
  ])
  res.json(agg)
}

export async function byCategory(_req, res) {
  const agg = await Lead.aggregate([
    { $group: {
        _id: '$category',
        leads: { $sum: 1 },
        won:   { $sum: { $cond: [{ $eq: ['$stage', 'Won'] }, 1, 0] } },
    }},
  ])
  const result = BUSINESS_CATEGORIES.map(c => {
    const row = agg.find(r => r._id === c.id)
    return { id: c.id, name: c.label, leads: row?.leads || 0, won: row?.won || 0 }
  })
  res.json(result)
}

export async function teamProductivity(_req, res) {
  const team = await TeamMember.find({ role: { $in: ['Business Development', 'Client Servicing'] } }).lean()
  const agg = await Lead.aggregate([
    { $match: { bdOwner: { $ne: null } } },
    { $group: {
        _id: '$bdOwner',
        leads: { $sum: 1 },
        won:   { $sum: { $cond: [{ $eq: ['$stage', 'Won'] }, 1, 0] } },
    }},
  ])
  const stats = team.map(u => {
    const row = agg.find(r => r._id === u._id)
    return { id: u._id, name: u.name, role: u.role, leads: row?.leads || 0, won: row?.won || 0 }
  })
  res.json(stats)
}

export async function upcoming(req, res) {
  const days = Math.max(1, Number(req.query.days) || 14)
  const today   = new Date().toISOString().slice(0, 10)
  const horizon = new Date(Date.now() + days * 86400_000).toISOString().slice(0, 10)
  const events = await CalendarEvent.find({ date: { $gte: today, $lte: horizon } })
    .sort({ date: 1, time: 1 }).lean()
  res.json(events.map(e => ({ id: e._id, ...e, _id: undefined })))
}

export async function lostLeads(_req, res) {
  const lost = await Lead.find({ stage: 'Lost' }).sort({ createdAt: -1 }).lean()
  res.json(lost.map(l => { const { _id, ...rest } = l; return { id: _id, ...rest } }))
}
