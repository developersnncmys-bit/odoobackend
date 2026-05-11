import mongoose from 'mongoose'
import { ROLES } from '../utils/constants.js'

const teamMemberSchema = new mongoose.Schema({
  _id:    { type: String },                      // 'u1'
  name:   { type: String, required: true, trim: true },
  role:   { type: String, enum: ROLES, required: true },
  email:  { type: String, required: true, lowercase: true, trim: true,
            validate: v => /^\S+@\S+\.\S+$/.test(v) },
  avatar: { type: String, default: '' },         // initials
}, {
  versionKey: false,
  toJSON:   { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
  toObject: { transform: (_d, ret) => { ret.id = ret._id; delete ret._id; return ret } },
})

export default mongoose.models.TeamMember || mongoose.model('TeamMember', teamMemberSchema)
