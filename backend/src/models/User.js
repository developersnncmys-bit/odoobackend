// CRM user account — separate from TeamMember (which is just a directory entry
// for assignment dropdowns). A User has CRM login credentials and a role that
// drives RBAC; TeamMember has a name & avatar for the UI.
//
// Per §12 the roles match the role list in constants.js (Admin + DEPARTMENTS).

import mongoose from 'mongoose'
import { ROLES } from '../utils/constants.js'

const userSchema = new mongoose.Schema({
  _id:          { type: String },                     // 'usr-1'
  username:     { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
  email:        { type: String, required: true, trim: true, lowercase: true },
  name:         { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role:         { type: String, enum: ROLES, default: 'Business Development' },
  teamMemberId: { type: String, default: null },
  active:       { type: Boolean, default: true },
  createdAt:    { type: String, default: () => new Date().toISOString().slice(0, 10) },
  lastLoginAt:  { type: String, default: null },
}, {
  versionKey: false,
  toJSON: {
    transform: (_d, ret) => {
      ret.id = ret._id
      delete ret._id
      delete ret.passwordHash
      return ret
    },
  },
  toObject: {
    transform: (_d, ret) => {
      ret.id = ret._id
      delete ret._id
      delete ret.passwordHash
      return ret
    },
  },
})

export default mongoose.models.User || mongoose.model('User', userSchema)
