// Notifications — doc §16.
import { Notification } from '../models/index.js'
import { HttpError } from '../middleware/async-handler.js'
import { nextId } from '../utils/ids.js'

const toApi = (doc) => { const { _id, ...rest } = doc; return { id: _id, ...rest } }

export async function list(req, res) {
  const { unread } = req.query
  const filter = unread === 'true' ? { read: false } : {}
  const items = await Notification.find(filter).sort({ time: -1 }).lean()
  res.json(items.map(toApi))
}

export async function create(req, res) {
  const { text, type = 'system' } = req.body
  if (!text) throw new HttpError(400, 'text is required')
  const n = await Notification.create({
    _id: await nextId('notifications'),
    text, type, read: false,
  })
  res.status(201).json(n.toJSON())
}

export async function markRead(req, res) {
  const n = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true })
  if (!n) throw new HttpError(404, 'Notification not found')
  res.json(n.toJSON())
}

export async function markAllRead(_req, res) {
  const result = await Notification.updateMany({ read: false }, { read: true })
  res.json({ marked: result.modifiedCount })
}
