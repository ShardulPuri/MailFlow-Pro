const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    companyName: String,
    location: String,
    email: {
      type: String,
      required: true
    },
    products: [String]
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  plainText: String,
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'scheduled'],
    default: 'pending'
  },
  deliveryStatus: {
    type: String,
    enum: ['delivered', 'opened', 'bounced', 'failed', 'pending'],
    default: 'pending'
  },
  scheduledTime: Date,
  sentTime: Date,
  emailProvider: {
    type: String,
    enum: ['gmail', 'sendgrid', 'outlook'],
    required: true
  },
  messageId: String,
  openTime: Date,
  deliveredTime: Date
}, { timestamps: true });

module.exports = mongoose.model('Email', emailSchema); 