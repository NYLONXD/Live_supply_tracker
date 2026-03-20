const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // URL-safe unique identifier: "Raja's Logistics" → "rajas-logistics"
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // The admin who created this org
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Optional branding / contact info
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// Auto-generate slug from name
organizationSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
      .replace(/\s+/g, '-')            // spaces → hyphens
      .replace(/-+/g, '-')             // collapse multiple hyphens
      .slice(0, 60);                   // max length
  }
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);