// Proposals — doc §8 (versioning, GST, status, categories).
import { Proposal } from '../models/index.js'
import { HttpError } from '../middleware/async-handler.js'
import { nextId } from '../utils/ids.js'
import { PROPOSAL_STATUSES, PROPOSAL_CATEGORIES, GST_RATE } from '../utils/constants.js'

const toApi = (doc) => { const { _id, ...rest } = doc; return { id: _id, ...rest } }

export async function list(req, res) {
  const { status, category, leadId } = req.query
  const filter = {}
  if (status)   filter.status   = status
  if (category) filter.category = category
  if (leadId)   filter.leadId   = leadId
  const items = await Proposal.find(filter).sort({ createdAt: -1, _id: -1 }).lean()
  res.json(items.map(toApi))
}

export async function create(req, res) {
  const { title, amount, category, leadId, owner = 'u1' } = req.body
  if (!title)         throw new HttpError(400, 'title is required')
  if (amount == null) throw new HttpError(400, 'amount is required')
  if (category && !PROPOSAL_CATEGORIES.includes(category)) {
    throw new HttpError(400, `category must be one of: ${PROPOSAL_CATEGORIES.join(', ')}`)
  }

  const amt = Number(amount)
  const proposal = await Proposal.create({
    _id: await nextId('proposals'),
    leadId, title,
    version: 1,
    category: category || 'Corporate Proposal',
    amount: amt,
    gst: req.body.gst != null ? Number(req.body.gst) : Math.round(amt * GST_RATE),
    status: 'Draft',
    owner,
  })
  res.status(201).json(proposal.toJSON())
}

export async function get(req, res) {
  const p = await Proposal.findById(req.params.id)
  if (!p) throw new HttpError(404, 'Proposal not found')
  res.json(p.toJSON())
}

export async function update(req, res) {
  if (req.body.status && !PROPOSAL_STATUSES.includes(req.body.status)) {
    throw new HttpError(400, `status must be one of: ${PROPOSAL_STATUSES.join(', ')}`)
  }
  const updates = { ...req.body }
  if (updates.amount != null) {
    updates.amount = Number(updates.amount)
    if (updates.gst == null) updates.gst = Math.round(updates.amount * GST_RATE)
  }
  if (updates.gst != null) updates.gst = Number(updates.gst)

  const p = await Proposal.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
  if (!p) throw new HttpError(404, 'Proposal not found')
  res.json(p.toJSON())
}

export async function bumpVersion(req, res) {
  const p = await Proposal.findById(req.params.id)
  if (!p) throw new HttpError(404, 'Proposal not found')
  p.version  = (p.version || 1) + 1
  p.status   = 'Draft'
  p.createdAt = new Date().toISOString().slice(0, 10)
  await p.save()
  res.json(p.toJSON())
}

export async function remove(req, res) {
  const p = await Proposal.findByIdAndDelete(req.params.id)
  if (!p) throw new HttpError(404, 'Proposal not found')
  res.status(204).end()
}
