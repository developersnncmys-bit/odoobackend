// §9 — Quotation: an itemized price breakdown sent to the client.
// Distinct from §8 Proposal (the creative pitch with a single amount).
// A quotation belongs to either a Project (post-Won) or a Lead (pre-Won),
// and contains line items (description, qty, unit price).

import mongoose from 'mongoose'

const STATUSES = ['Draft', 'Sent', 'Accepted', 'Declined', 'Expired']

const itemSchema = new mongoose.Schema({
  id:          { type: String },                  // 'q1', 'q2', …
  description: { type: String, required: true, trim: true },
  category:    { type: String, default: '' },     // optional grouping: Sound / Decor / Catering / etc.
  qty:         { type: Number, default: 1 },
  unitPrice:   { type: Number, default: 0 },
  total:       { type: Number, default: 0 },      // = qty × unitPrice (also kept server-side)
}, { _id: false })

const quotationSchema = new mongoose.Schema({
  _id:        { type: String },                   // 'Q-5001'
  projectId:  { type: String, default: null },
  leadId:     { type: String, default: null },
  client:     { type: String, required: true, trim: true },
  title:      { type: String, required: true, trim: true },

  items:      { type: [itemSchema], default: [] },
  subtotal:   { type: Number, default: 0 },
  discount:   { type: Number, default: 0 },       // flat ₹ off (not %)
  gst:        { type: Number, default: 0 },       // computed at 18% unless overridden
  total:      { type: Number, default: 0 },       // subtotal − discount + gst

  validUntil: { type: String, default: '' },      // 'YYYY-MM-DD'
  notes:      { type: String, default: '' },      // terms / payment / cancellation
  status:     { type: String, enum: STATUSES, default: 'Draft', index: true },

  owner:      { type: String, default: null },
  createdAt:  { type: String, default: () => new Date().toISOString().slice(0, 10) },
  sentAt:     { type: String, default: null },
  acceptedAt: { type: String, default: null },
}, {
  versionKey: false,
  toJSON:   { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
  toObject: { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
})

export const QUOTATION_STATUSES = STATUSES
export default mongoose.models.Quotation || mongoose.model('Quotation', quotationSchema)
