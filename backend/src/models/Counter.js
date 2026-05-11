import mongoose from 'mongoose'

// One row per resource family. `seq` holds the most-recently-issued number.
// Sequential IDs like L-1001, P-2001, INV-4001 are produced by $inc'ing seq.
const counterSchema = new mongoose.Schema({
  _id: { type: String },             // 'leads' | 'projects' | ...
  seq: { type: Number, default: 0 },
}, { versionKey: false })

export default mongoose.models.Counter || mongoose.model('Counter', counterSchema)
