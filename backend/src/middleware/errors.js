import { HttpError } from './async-handler.js'

export function notFound(req, res) {
  res.status(404).json({ error: 'Not found', path: req.originalUrl })
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details })
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }
  console.error('[unhandled]', err)
  res.status(500).json({ error: 'Internal server error' })
}
