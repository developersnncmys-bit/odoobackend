import mongoose from 'mongoose'
import {
  OPPORTUNITY_STAGES, PRIORITIES, LEAD_SOURCES,
} from '../utils/constants.js'

const activitySchema = new mongoose.Schema({
  date: { type: String, required: true },     // YYYY-MM-DD
  type: { type: String, default: 'note' },     // note | meeting | email | call
  user: { type: String, required: true },     // team member id (u1, u2, ...)
  text: { type: String, required: true },
}, { _id: false })

const attachmentSchema = new mongoose.Schema({
  name: String,
  size: Number,
  url:  String,
}, { _id: false })

const leadSchema = new mongoose.Schema({
  _id: { type: String },                     // 'L-1001'

  // §4.2 Basic information
  clientName:  { type: String, required: true, trim: true },
  company:     { type: String, default: '', trim: true },
  contact:     { type: String, required: true, trim: true },
  email:       { type: String, default: '', trim: true, lowercase: true,
                  validate: v => !v || /^\S+@\S+\.\S+$/.test(v) },
  designation: { type: String, default: '' },
  city:        { type: String, default: '' },

  // §4.2 Event information
  eventName:  { type: String, required: true, trim: true },
  eventType:  { type: String, required: true },
  category:   { type: String, enum: ['corporate', 'wedding', 'social'] },
  eventDate:  { type: String, required: true },
  eventTime:  { type: String, default: '' },
  setupDate:  { type: String, default: '' },
  setupTime:  { type: String, default: '' },
  venue:      { type: String, required: true },
  guestCount: { type: Number, default: 0 },
  budget:     { type: Number, default: 0 },

  // §4.2 Sales information
  source:          { type: String, enum: LEAD_SOURCES, default: 'Website' },
  bdOwner:         { type: String, default: null },
  csOwner:         { type: String, default: null },
  stage:           { type: String, enum: OPPORTUNITY_STAGES, default: 'New', index: true },
  expectedRevenue: { type: Number, default: 0 },
  probability:     { type: Number, min: 0, max: 100, default: 0 },

  // §4.2 Additional
  notes:        { type: String, default: '' },
  followUpDate: { type: String, default: null },
  reminderDate: { type: String, default: null },
  priority:     { type: String, enum: PRIORITIES, default: 'Medium' },
  attachments:  { type: [attachmentSchema], default: [] },

  // Activity log + workflow housekeeping
  activities: { type: [activitySchema], default: [] },
  lostReason: { type: String, default: null },
  projectId:  { type: String, default: null },        // set by /win

  createdAt: { type: String, default: () => new Date().toISOString().slice(0, 10) },
}, {
  versionKey: false,
  toJSON: {
    virtuals: false,
    transform: (_doc, ret) => { ret.id = ret._id; delete ret._id; return ret },
  },
  toObject: { transform: (_doc, ret) => { ret.id = ret._id; delete ret._id; return ret } },
})

leadSchema.index({ stage: 1, category: 1 })
leadSchema.index({ bdOwner: 1 })

export default mongoose.models.Lead || mongoose.model('Lead', leadSchema)
