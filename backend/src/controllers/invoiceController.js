// Invoices — doc §11.5 + §14.3 accounts dashboard.
import { Invoice, Project, Notification } from '../models/index.js'
import { HttpError } from '../middleware/async-handler.js'
import { nextId } from '../utils/ids.js'
import { INVOICE_STATUSES, GST_RATE } from '../utils/constants.js'

const toApi = (doc) => { const { _id, ...rest } = doc; return { id: _id, ...rest } }

export async function list(req, res) {
  const { status, projectId } = req.query
  const filter = {}
  if (status)    filter.status    = status
  if (projectId) filter.projectId = projectId
  const items = await Invoice.find(filter).sort({ _id: -1 }).lean()
  res.json(items.map(toApi))
}

export async function create(req, res) {
  const { projectId, milestone, amount, client } = req.body
  if (!projectId)     throw new HttpError(400, 'projectId is required')
  if (!milestone)     throw new HttpError(400, 'milestone is required')
  if (amount == null) throw new HttpError(400, 'amount is required')

  const project = await Project.findById(projectId)
  if (!project) throw new HttpError(404, 'Project not found')

  const amt = Number(amount)
  const gst = req.body.gst != null ? Number(req.body.gst) : Math.round(amt * GST_RATE)
  const invoice = await Invoice.create({
    _id: await nextId('invoices'),
    projectId,
    client: client || project.client,
    amount: amt, gst, total: amt + gst,
    milestone, status: 'Pending',
  })

  // §13 automation — notify accounts dept
  await Notification.create({
    _id: await nextId('notifications'),
    text: `New invoice ${invoice._id} (${milestone}) for project ${projectId}`,
    type: 'invoice',
  })

  res.status(201).json(invoice.toJSON())
}

export async function get(req, res) {
  const inv = await Invoice.findById(req.params.id)
  if (!inv) throw new HttpError(404, 'Invoice not found')
  res.json(inv.toJSON())
}

export async function update(req, res) {
  if (req.body.status && !INVOICE_STATUSES.includes(req.body.status)) {
    throw new HttpError(400, `status must be one of: ${INVOICE_STATUSES.join(', ')}`)
  }
  const inv = await Invoice.findById(req.params.id)
  if (!inv) throw new HttpError(404, 'Invoice not found')

  Object.assign(inv, req.body)
  if (req.body.amount != null || req.body.gst != null) {
    inv.amount = req.body.amount != null ? Number(req.body.amount) : inv.amount
    inv.gst    = req.body.gst    != null ? Number(req.body.gst)    : inv.gst
    inv.total  = inv.amount + inv.gst
  }
  if (req.body.status === 'Paid' && !inv.paidDate) {
    inv.paidDate = new Date().toISOString().slice(0, 10)
  }
  await inv.save()
  res.json(inv.toJSON())
}

export async function markPaid(req, res) {
  const inv = await Invoice.findById(req.params.id)
  if (!inv) throw new HttpError(404, 'Invoice not found')
  inv.status   = 'Paid'
  inv.paidDate = req.body?.paidDate || new Date().toISOString().slice(0, 10)
  await inv.save()
  res.json(inv.toJSON())
}
