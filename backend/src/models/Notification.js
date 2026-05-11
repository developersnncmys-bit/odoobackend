import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  _id:  { type: String },                        // 'N1'
  text: { type: String, required: true },
  type: { type: String, default: 'system' },     // lead | event | invoice | meeting | project | system
  read: { type: Boolean, default: false, index: true },
  time: { type: String, default: () => new Date().toISOString() },
}, {
  versionKey: false,
  toJSON:   { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
  toObject: { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
})

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema)
