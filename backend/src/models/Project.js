import mongoose from 'mongoose'
import {
  PROJECT_STATUSES, EXECUTION_STAGES, TASK_STATUSES, VENDOR_STATUSES,
} from '../utils/constants.js'

const taskSchema = new mongoose.Schema({
  id:       { type: String, required: true },   // 't1', 't2', ...
  title:    { type: String, required: true },
  assignee: String,
  dueDate:  String,
  status:   { type: String, enum: TASK_STATUSES, default: 'Pending' },
  dept:     String,
}, { _id: false })

const vendorSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  service: String,
  amount:  { type: Number, default: 0 },
  status:  { type: String, enum: VENDOR_STATUSES, default: 'Pending' },
}, { _id: false })

const messageSchema = new mongoose.Schema({
  id:   { type: String, required: true },        // 'm1', 'm2', ...
  user: { type: String, required: true },
  text: { type: String, required: true },
  time: { type: String, default: () => new Date().toISOString() },
}, { _id: false })

const projectSchema = new mongoose.Schema({
  _id:     { type: String },                     // 'P-2001'
  leadId:  { type: String, default: null },

  name:      { type: String, required: true },
  client:    { type: String, required: true },
  category:  { type: String, enum: ['corporate', 'wedding', 'mice', 'exhibition'] },
  eventDate: { type: String, required: true },
  setupDate: { type: String, default: '' },
  venue:     { type: String, required: true },

  budget: { type: Number, default: 0 },
  spent:  { type: Number, default: 0 },

  status:   { type: String, enum: PROJECT_STATUSES, default: 'Awaiting PO', index: true },
  stage:    { type: String, enum: EXECUTION_STAGES, default: 'Pre-Event' },
  progress: { type: Number, min: 0, max: 100, default: 0 },

  csOwner:        { type: String, default: null },
  productionLead: { type: String, default: null },
  designLead:     { type: String, default: null },
  team:           { type: [String], default: [] },

  tasks:    { type: [taskSchema],    default: [] },
  vendors:  { type: [vendorSchema],  default: [] },
  messages: { type: [messageSchema], default: [] },
}, {
  versionKey: false,
  toJSON:   { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
  toObject: { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
})

export default mongoose.models.Project || mongoose.model('Project', projectSchema)
