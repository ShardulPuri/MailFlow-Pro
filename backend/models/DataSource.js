const mongoose = require('mongoose');

const dataSourceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['google_sheets', 'csv', 'manual'],
    required: true
  },
  config: {
    spreadsheetId: String,
    sheetName: String,
    range: String,
    headerRow: Number,
    refreshToken: String,
    lastSync: Date,
    columnMappings: {
      type: Map,
      of: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'error', 'disconnected'],
    default: 'active'
  },
  lastError: String,
  lastSyncData: [{
    type: Map,
    of: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('DataSource', dataSourceSchema); 