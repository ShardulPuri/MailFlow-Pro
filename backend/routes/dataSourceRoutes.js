const express = require('express');
const router = express.Router();
const dataSourceController = require('../controllers/dataSourceController');
const auth = require('../middleware/auth');

// Google Sheets authentication routes
router.get('/sheets/auth-url', auth, dataSourceController.getGoogleAuthUrl);
router.post('/sheets/callback', auth, dataSourceController.handleGoogleCallback);
router.get('/sheets/status', auth, dataSourceController.getConnectionStatus);

// Spreadsheet management routes
router.get('/sheets/list', auth, dataSourceController.listSpreadsheets);
router.get('/sheets/:spreadsheetId/metadata', auth, dataSourceController.getSheetMetadata);
router.post('/sheets/:spreadsheetId/preview', auth, dataSourceController.getSheetPreview);

// Data source configuration routes
router.post('/configure', auth, dataSourceController.configureDataSource);
router.get('/list', auth, dataSourceController.listDataSources);
router.get('/:dataSourceId', auth, dataSourceController.getDataSource);
router.put('/:dataSourceId', auth, dataSourceController.updateDataSource);
router.delete('/:dataSourceId', auth, dataSourceController.deleteDataSource);

// Data sync routes
router.post('/:dataSourceId/sync', auth, dataSourceController.syncData);
router.get('/:dataSourceId/sync/status', auth, dataSourceController.getSyncStatus);

module.exports = router; 