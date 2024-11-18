const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['sales', 'marketing', 'support', 'other'],
    default: 'other'
  },
  tags: [String],
  isShared: {
    type: Boolean,
    default: false
  },
  variables: [{
    name: String,
    description: String,
    required: Boolean
  }],
  stats: {
    timesUsed: {
      type: Number,
      default: 0
    },
    avgResponseRate: {
      type: Number,
      default: 0
    }
  },
  lastUsed: Date
}, { timestamps: true });

module.exports = mongoose.model('Template', templateSchema); 