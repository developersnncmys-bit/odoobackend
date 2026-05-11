// Projects — doc §7 (project mgmt) + §10.2 (project chatbox) + tasks/vendors.
import { Project } from '../models/index.js'
import { HttpError } from '../middleware/async-handler.js'
import { nextId, nextSubId } from '../utils/ids.js'
import { TASK_STATUSES, EXECUTION_STAGES, VENDOR_STATUSES } from '../utils/constants.js'

const toApi = (doc) => { const { _id, ...rest } = doc; return { id: _id, ...rest } }

/* --------- Collection --------- */

export async function list(req, res) {
  const { status, stage, category } = req.query
  const filter = {}
  if (status)   filter.status   = status
  if (stage)    filter.stage    = stage
  if (category) filter.category = category
  const projects = await Project.find(filter).sort({ _id: -1 }).lean()
  res.json(projects.map(toApi))
}

export async function create(req, res) {
  const required = ['name', 'client', 'eventDate', 'venue']
  const missing = required.filter(f => !req.body[f])
  if (missing.length) throw new HttpError(400, 'Missing required fields', { missing })

  const id = await nextId('projects')
  const project = await Project.create({
    _id: id,
    ...req.body,
    budget: Number(req.body.budget || 0),
    spent:  Number(req.body.spent  || 0),
  })
  res.status(201).json(project.toJSON())
}

/* --------- Single --------- */

export async function get(req, res) {
  const project = await Project.findById(req.params.id)
  if (!project) throw new HttpError(404, 'Project not found')
  res.json(project.toJSON())
}

export async function update(req, res) {
  if (req.body.stage && !EXECUTION_STAGES.includes(req.body.stage)) {
    throw new HttpError(400, `stage must be one of: ${EXECUTION_STAGES.join(', ')}`)
  }
  const updates = { ...req.body }
  if (updates.budget != null) updates.budget = Number(updates.budget)
  if (updates.spent  != null) updates.spent  = Number(updates.spent)

  const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
  if (!project) throw new HttpError(404, 'Project not found')
  res.json(project.toJSON())
}

/* --------- Tasks --------- */

export async function addTask(req, res) {
  const { title, assignee, dueDate, dept, status = 'Pending' } = req.body
  if (!title) throw new HttpError(400, 'title is required')
  if (!TASK_STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${TASK_STATUSES.join(', ')}`)
  }

  const project = await Project.findById(req.params.id)
  if (!project) throw new HttpError(404, 'Project not found')

  const task = { id: nextSubId(project.tasks, 't'), title, assignee, dueDate, dept, status }
  project.tasks.push(task)
  await project.save()
  res.status(201).json(task)
}

export async function updateTask(req, res) {
  if (req.body.status && !TASK_STATUSES.includes(req.body.status)) {
    throw new HttpError(400, `status must be one of: ${TASK_STATUSES.join(', ')}`)
  }
  const project = await Project.findById(req.params.id)
  if (!project) throw new HttpError(404, 'Project not found')
  const task = project.tasks.find(t => t.id === req.params.taskId)
  if (!task) throw new HttpError(404, 'Task not found')
  Object.assign(task, req.body)
  await project.save()
  res.json(task)
}

export async function removeTask(req, res) {
  const project = await Project.findById(req.params.id)
  if (!project) throw new HttpError(404, 'Project not found')
  const before = project.tasks.length
  project.tasks = project.tasks.filter(t => t.id !== req.params.taskId)
  if (project.tasks.length === before) throw new HttpError(404, 'Task not found')
  await project.save()
  res.status(204).end()
}

/* --------- Vendors --------- */

export async function addVendor(req, res) {
  const { name, service, amount = 0, status = 'Pending' } = req.body
  if (!name) throw new HttpError(400, 'name is required')
  if (!VENDOR_STATUSES.includes(status)) {
    throw new HttpError(400, `status must be one of: ${VENDOR_STATUSES.join(', ')}`)
  }
  const project = await Project.findById(req.params.id)
  if (!project) throw new HttpError(404, 'Project not found')

  const vendor = { name, service, amount: Number(amount), status }
  project.vendors.push(vendor)
  await project.save()
  res.status(201).json(vendor)
}

/* --------- Project chat (§10.2) --------- */

export async function listMessages(req, res) {
  const project = await Project.findById(req.params.id).select('messages')
  if (!project) throw new HttpError(404, 'Project not found')
  res.json(project.messages)
}

export async function postMessage(req, res) {
  const { user, text } = req.body
  if (!user) throw new HttpError(400, 'user is required')
  if (!text || !String(text).trim()) throw new HttpError(400, 'text is required')

  const project = await Project.findById(req.params.id)
  if (!project) throw new HttpError(404, 'Project not found')

  const msg = {
    id: nextSubId(project.messages, 'm'),
    user, text, time: new Date().toISOString(),
  }
  project.messages.push(msg)
  await project.save()
  res.status(201).json(msg)
}
