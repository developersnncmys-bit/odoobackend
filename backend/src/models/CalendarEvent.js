import mongoose from 'mongoose'
import { CALENDAR_TYPES, DEPARTMENTS } from '../utils/constants.js'

const calendarEventSchema = new mongoose.Schema({
  _id:   { type: String },                       // 'E-1'
  title: { type: String, required: true },
  date:  { type: String, required: true, index: true },  // YYYY-MM-DD
  time:  { type: String, default: '10:00' },
  type:  { type: String, enum: CALENDAR_TYPES, default: 'meeting' },
  leadId:    { type: String, default: null },
  projectId: { type: String, default: null, index: true },
  dept:  { type: String, enum: DEPARTMENTS, default: null },
}, {
  versionKey: false,
  toJSON:   { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
  toObject: { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
})

export default mongoose.models.CalendarEvent || mongoose.model('CalendarEvent', calendarEventSchema)
