import mongoose from 'mongoose'
import { DOCUMENT_TYPES } from '../utils/constants.js'

const documentSchema = new mongoose.Schema({
  _id:        { type: String },                  // 'D-1'
  name:       { type: String, required: true },
  type:       { type: String, enum: DOCUMENT_TYPES, default: 'Other' },
  size:       { type: String, default: '0 KB' }, // display-formatted
  linkedTo:   { type: String, required: true, index: true }, // lead/project ID
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  url:        { type: String, default: null },   // populated by storage layer
}, {
  versionKey: false,
  toJSON:   { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
  toObject: { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
})

export default mongoose.models.Document || mongoose.model('Document', documentSchema)
