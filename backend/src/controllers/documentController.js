// Documents — doc §9. Metadata only; binary uploads belong on a separate layer.
import { Document } from '../models/index.js'
import { HttpError } from '../middleware/async-handler.js'
import { nextId } from '../utils/ids.js'
import { DOCUMENT_TYPES } from '../utils/constants.js'

const toApi = (doc) => { const { _id, ...rest } = doc; return { id: _id, ...rest } }

export async function list(req, res) {
  const { linkedTo, type } = req.query
  const filter = {}
  if (linkedTo) filter.linkedTo = linkedTo
  if (type)     filter.type     = type
  const items = await Document.find(filter).sort({ uploadedAt: -1, _id: -1 }).lean()
  res.json(items.map(toApi))
}

export async function create(req, res) {
  const { name, type = 'Other', linkedTo, uploadedBy = 'u1', size = '0 KB', url = null } = req.body
  if (!name)     throw new HttpError(400, 'name is required')
  if (!linkedTo) throw new HttpError(400, 'linkedTo is required (lead/project ID)')
  if (!DOCUMENT_TYPES.includes(type)) {
    throw new HttpError(400, `type must be one of: ${DOCUMENT_TYPES.join(', ')}`)
  }

  const doc = await Document.create({
    _id: await nextId('documents'),
    name, type, size, linkedTo, uploadedBy, url,
  })
  res.status(201).json(doc.toJSON())
}

export async function remove(req, res) {
  const d = await Document.findByIdAndDelete(req.params.id)
  if (!d) throw new HttpError(404, 'Document not found')
  res.status(204).end()
}
