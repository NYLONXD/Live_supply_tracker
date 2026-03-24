const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: {
    // optional — pre-fill the form if admin typed email
    type: String,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['driver', 'user'],
    default: 'driver',
  },
  usedAt: Date,         // null = still valid
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Invite', inviteSchema);