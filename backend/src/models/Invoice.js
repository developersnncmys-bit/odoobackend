import mongoose from 'mongoose'
import { INVOICE_STATUSES } from '../utils/constants.js'

const invoiceSchema = new mongoose.Schema({
  _id:       { type: String },                  // 'INV-4001'
  projectId: { type: String, required: true, index: true },
  client:    { type: String, required: true },
  amount:    { type: Number, default: 0 },
  gst:       { type: Number, default: 0 },
  total:     { type: Number, default: 0 },
  milestone: { type: String, required: true },  // 'Advance 50%', etc.
  status:    { type: String, enum: INVOICE_STATUSES, default: 'Pending', index: true },
  issuedDate:{ type: String, default: null },
  paidDate:  { type: String, default: null },
}, {
  versionKey: false,
  toJSON:   { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
  toObject: { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
})

invoiceSchema.pre('save', function (next) {
  this.total = (this.amount || 0) + (this.gst || 0)
  next()
})

export default mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema)
