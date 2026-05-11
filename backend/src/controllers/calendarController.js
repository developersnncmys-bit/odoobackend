// Calendar — doc §5 (events, setups, recces, meetings).
import { CalendarEvent } from '../models/index.js'
import { HttpError } from '../middleware/async-handler.js'
import { nextId } from '../utils/ids.js'
import { CALENDAR_TYPES } from '../utils/constants.js'

const toApi = (doc) => { const { _id, ...rest } = doc; return { id: _id, ...rest } }

export async function list(req, res) {
  const { from, to, dept, type } = req.query
  const filter = {}
  if (from || to) filter.date = {}
  if (from) filter.date.$gte = from
  if (to)   filter.date.$lte = to
  if (dept) filter.dept = dept
  if (type) filter.type = type
  const events = await CalendarEvent.find(filter).sort({ date: 1, time: 1 }).lean()
  res.json(events.map(toApi))
}

export async function create(req, res) {
  const { title, date, time = '10:00', type = 'meeting', dept } = req.body
  if (!title) throw new HttpError(400, 'title is required')
  if (!date)  throw new HttpError(400, 'date is required (YYYY-MM-DD)')
  if (!CALENDAR_TYPES.includes(type)) {
    throw new HttpError(400, `type must be one of: ${CALENDAR_TYPES.join(', ')}`)
  }

  const event = await CalendarEvent.create({
    _id: await nextId('calendarEvents'),
    title, date, time, type, dept,
    leadId:    req.body.leadId    || null,
    projectId: req.body.projectId || null,
  })
  res.status(201).json(event.toJSON())
}

export async function update(req, res) {
  if (req.body.type && !CALENDAR_TYPES.includes(req.body.type)) {
    throw new HttpError(400, `type must be one of: ${CALENDAR_TYPES.join(', ')}`)
  }
  const event = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
  if (!event) throw new HttpError(404, 'Event not found')
  res.json(event.toJSON())
}

export async function remove(req, res) {
  const e = await CalendarEvent.findByIdAndDelete(req.params.id)
  if (!e) throw new HttpError(404, 'Event not found')
  res.status(204).end()
}
