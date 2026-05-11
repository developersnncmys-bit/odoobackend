import mongoose from 'mongoose'
import { PROPOSAL_STATUSES, PROPOSAL_CATEGORIES } from '../utils/constants.js'

const proposalSchema = new mongoose.Schema({
  _id:     { type: String },                    // 'PR-3001'
  leadId:  { type: String, default: null },
  title:   { type: String, required: true, trim: true },
  version: { type: Number, default: 1 },
  category:{ type: String, enum: PROPOSAL_CATEGORIES, default: 'Corporate Proposal' },
  amount:  { type: Number, default: 0 },
  gst:     { type: Number, default: 0 },
  status:  { type: String, enum: PROPOSAL_STATUSES, default: 'Draft', index: true },
  createdAt:{ type: String, default: () => new Date().toISOString().slice(0, 10) },
  owner:   { type: String, default: null },
}, {
  versionKey: false,
  toJSON:   { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
  toObject: { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
})

export default mongoose.models.Proposal || mongoose.model('Proposal', proposalSchema)
