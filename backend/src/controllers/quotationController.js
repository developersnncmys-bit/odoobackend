// §9 — Quotation CRUD + Send / Accept / Decline transitions.
//
// Line-item totals are RECOMPUTED server-side regardless of what the client
// sends, so the table totals can never drift from the row data. GST defaults
// to 18% of (subtotal - discount), but the caller can override.

import { Quotation, Project, Lead, Notification } from '../models/index.js'
import { HttpError } from '../middleware/async-handler.js'
import { nextId, nextSubId } from '../utils/ids.js'
import { GST_RATE } from '../utils/constants.js'
import { QUOTATION_STATUSES } from '../models/Quotation.js'

const today = () => new Date().toISOString().slice(0, 10)

/** Normalise items and recompute subtotal/total. */
function recalc(body) {
  const rawItems = Array.isArray(body.items) ? body.items : []
  const items = rawItems
    .filter(it => it && (it.description || '').trim() !== '')
    .map((it, i) => {
      const qty = Number(it.qty ?? 1) || 0
      const unitPrice = Number(it.unitPrice ?? 0) || 0
      return {
        id:          it.id || `q${i + 1}`,
        description: String(it.description).trim(),
        category:    String(it.category || '').trim(),
        qty,
        unitPrice,
        total:       Math.round(qty * unitPrice),
      }
    })

  const subtotal = items.reduce((s, it) => s + it.total, 0)
  const discount = Number(body.discount || 0)
  const taxable  = Math.max(0, subtotal - discount)
  const gst      = body.gst != null ? Number(body.gst) : Math.round(taxable * GST_RATE)
  const total    = taxable + gst

  return { items, subtotal, discount, gst, total }
}

/* --------- list / get --------- */

export async function list(req, res) {
  const { projectId, leadId, status } = req.query
  const filter = {}
  if (projectId) filter.projectId = projectId
  if (leadId)    filter.leadId    = leadId
  if (status)    filter.status    = status
  const items = await Quotation.find(filter).sort({ _id: -1 }).lean()
  res.json(items.map(d => ({ ...d, id: d._id, _id: undefined })))
}

export async function get(req, res) {
  const q = await Quotation.findById(req.params.id)
  if (!q) throw new HttpError(404, 'Quotation not found')
  res.json(q.toJSON())
}

/* --------- create / update / delete --------- */

export async function create(req, res) {
  const { projectId, leadId, client, title, validUntil, notes, owner } = req.body || {}
  if (!title)                throw new HttpError(400, 'title is required')
  if (!projectId && !leadId) throw new HttpError(400, 'Either projectId or leadId is required')

  // Resolve client name from the project / lead if not supplied
  let clientName = client
  if (!clientName && projectId) {
    const p = await Project.findById(projectId).lean()
    clientName = p?.client
  }
  if (!clientName && leadId) {
    const l = await Lead.findById(leadId).lean()
    clientName = l?.company || l?.clientName
  }
  if (!clientName) throw new HttpError(400, 'client name could not be resolved')

  const { items, subtotal, discount, gst, total } = recalc(req.body)

  const id = await nextId('quotations')
  const quotation = await Quotation.create({
    _id: id,
    projectId: projectId || null,
    leadId:    leadId    || null,
    client:    clientName,
    title,
    items, subtotal, discount, gst, total,
    validUntil: validUntil || '',
    notes:      notes || '',
    owner:      owner || null,
    status:     'Draft',
  })

  res.status(201).json(quotation.toJSON())
}

export async function update(req, res) {
  if (req.body.status && !QUOTATION_STATUSES.includes(req.body.status)) {
    throw new HttpError(400, `status must be one of: ${QUOTATION_STATUSES.join(', ')}`)
  }
  const q = await Quotation.findById(req.params.id)
  if (!q) throw new HttpError(404, 'Quotation not found')

  const updates = { ...req.body }
  // If items / discount / gst changed, recompute totals
  if (Array.isArray(req.body.items) || req.body.discount != null || req.body.gst != null) {
    const merged = {
      items:    Array.isArray(req.body.items) ? req.body.items : q.items,
      discount: req.body.discount != null ? req.body.discount : q.discount,
      gst:      req.body.gst,
    }
    const { items, subtotal, discount, gst, total } = recalc(merged)
    updates.items = items; updates.subtotal = subtotal
    updates.discount = discount; updates.gst = gst; updates.total = total
  }

  Object.assign(q, updates)
  await q.save()
  res.json(q.toJSON())
}

export async function remove(req, res) {
  const q = await Quotation.findByIdAndDelete(req.params.id)
  if (!q) throw new HttpError(404, 'Quotation not found')
  res.status(204).end()
}

/* --------- transitions --------- */

export async function send(req, res) {
  const q = await Quotation.findById(req.params.id)
  if (!q) throw new HttpError(404, 'Quotation not found')
  q.status = 'Sent'
  q.sentAt = today()
  await q.save()
  res.json(q.toJSON())
}

export async function accept(req, res) {
  const q = await Quotation.findById(req.params.id)
  if (!q) throw new HttpError(404, 'Quotation not found')
  q.status = 'Accepted'
  q.acceptedAt = today()
  await q.save()

  // §13 — let Accounts know the client accepted a quotation
  await Notification.create({
    _id: await nextId('notifications'),
    text: `Quotation ${q._id} accepted by ${q.client} — Accounts may now invoice`,
    type: 'quotation',
  })

  res.json(q.toJSON())
}

export async function decline(req, res) {
  const q = await Quotation.findById(req.params.id)
  if (!q) throw new HttpError(404, 'Quotation not found')
  q.status = 'Declined'
  await q.save()
  res.json(q.toJSON())
}

/* --------- line items (incremental edits) --------- */

export async function addItem(req, res) {
  const q = await Quotation.findById(req.params.id)
  if (!q) throw new HttpError(404, 'Quotation not found')

  const description = String(req.body.description || '').trim()
  if (!description) throw new HttpError(400, 'description is required')

  const qty = Number(req.body.qty ?? 1) || 1
  const unitPrice = Number(req.body.unitPrice ?? 0) || 0

  const item = {
    id: nextSubId(q.items, 'q'),
    description,
    category: String(req.body.category || '').trim(),
    qty,
    unitPrice,
    total: Math.round(qty * unitPrice),
  }
  q.items.push(item)
  const totals = recalc({ items: q.items, discount: q.discount, gst: undefined })
  q.subtotal = totals.subtotal; q.gst = totals.gst; q.total = totals.total
  await q.save()
  res.status(201).json(q.toJSON())
}

export async function removeItem(req, res) {
  const q = await Quotation.findById(req.params.id)
  if (!q) throw new HttpError(404, 'Quotation not found')
  const before = q.items.length
  q.items = q.items.filter(it => it.id !== req.params.itemId)
  if (q.items.length === before) throw new HttpError(404, 'Item not found')
  const totals = recalc({ items: q.items, discount: q.discount, gst: undefined })
  q.subtotal = totals.subtotal; q.gst = totals.gst; q.total = totals.total
  await q.save()
  res.json(q.toJSON())
}
