const DataSource = require('../models/DataSource');
const googleSheetsService = require('../services/googleSheetsService');

const dataSourceController = {
  async getGoogleAuthUrl(req, res) {
    try {
      const authUrl = await googleSheetsService.getAuthUrl();
      res.json({ authUrl });
    } catch (error) {
      console.error('Error getting auth URL:', error);
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  },

  async handleGoogleCallback(req, res) {
    try {
      const { code } = req.query;
      const tokens = await googleSheetsService.handleCallback(code, req.user._id);
      res.json({ success: true, tokens });
    } catch (error) {
      console.error('Error handling callback:', error);
      res.status(500).json({ error: 'Failed to handle Google callback' });
    }
  },

  async getConnectionStatus(req, res) {
    try {
      const dataSource = await DataSource.findOne({
        user: req.user._id,
        type: 'google_sheets'
      });
      res.json({ connected: !!dataSource?.config?.refreshToken });
    } catch (error) {
      console.error('Error checking connection status:', error);
      res.status(500).json({ error: 'Failed to check connection status' });
    }
  },

  async listSpreadsheets(req, res) {
    try {
      const dataSource = await DataSource.findOne({
        user: req.user._id,
        type: 'google_sheets'
      });

      if (!dataSource?.config?.refreshToken) {
        return res.status(400).json({ error: 'Google Sheets not connected' });
      }

      const spreadsheets = await googleSheetsService.listSpreadsheets(
        dataSource.config.refreshToken
      );

      res.json({ spreadsheets });
    } catch (error) {
      console.error('Error listing spreadsheets:', error);
      res.status(500).json({ error: 'Failed to list spreadsheets' });
    }
  },

  async getSheetMetadata(req, res) {
    try {
      const { spreadsheetId } = req.params;
      const dataSource = await DataSource.findOne({
        user: req.user._id,
        type: 'google_sheets'
      });

      const metadata = await googleSheetsService.getSpreadsheetMetadata(
        spreadsheetId,
        dataSource.config.refreshToken
      );

      res.json({ metadata });
    } catch (error) {
      console.error('Error getting sheet metadata:', error);
      res.status(500).json({ error: 'Failed to get sheet metadata' });
    }
  },

  async getSheetPreview(req, res) {
    try {
      const { spreadsheetId } = req.params;
      const { sheetName, headerRow } = req.body;
      const dataSource = await DataSource.findOne({
        user: req.user._id,
        type: 'google_sheets'
      });

      const data = await googleSheetsService.getPreviewData(
        spreadsheetId,
        sheetName,
        headerRow,
        dataSource.config.refreshToken
      );

      res.json({ data });
    } catch (error) {
      console.error('Error getting preview:', error);
      res.status(500).json({ error: 'Failed to get preview' });
    }
  },

  async configureDataSource(req, res) {
    try {
      const { name, type, config } = req.body;
      const dataSource = await DataSource.create({
        user: req.user._id,
        name,
        type,
        config
      });
      res.json({ success: true, dataSource });
    } catch (error) {
      console.error('Error configuring data source:', error);
      res.status(500).json({ error: 'Failed to configure data source' });
    }
  },

  async listDataSources(req, res) {
    try {
      const dataSources = await DataSource.find({ user: req.user._id });
      res.json({ dataSources });
    } catch (error) {
      console.error('Error listing data sources:', error);
      res.status(500).json({ error: 'Failed to list data sources' });
    }
  },

  async getDataSource(req, res) {
    try {
      const dataSource = await DataSource.findOne({
        _id: req.params.dataSourceId,
        user: req.user._id
      });
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      res.json(dataSource);
    } catch (error) {
      console.error('Error getting data source:', error);
      res.status(500).json({ error: 'Failed to get data source' });
    }
  },

  async updateDataSource(req, res) {
    try {
      const updates = req.body;
      const dataSource = await DataSource.findOneAndUpdate(
        { _id: req.params.dataSourceId, user: req.user._id },
        updates,
        { new: true }
      );
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      res.json(dataSource);
    } catch (error) {
      console.error('Error updating data source:', error);
      res.status(500).json({ error: 'Failed to update data source' });
    }
  },

  async deleteDataSource(req, res) {
    try {
      const dataSource = await DataSource.findOneAndDelete({
        _id: req.params.dataSourceId,
        user: req.user._id
      });
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting data source:', error);
      res.status(500).json({ error: 'Failed to delete data source' });
    }
  },

  async syncData(req, res) {
    try {
      const { dataSourceId } = req.params;
      const data = await googleSheetsService.getSpreadsheetData(dataSourceId);
      res.json({ success: true, data });
    } catch (error) {
      console.error('Error syncing data:', error);
      res.status(500).json({ error: 'Failed to sync data' });
    }
  },

  async getSyncStatus(req, res) {
    try {
      const dataSource = await DataSource.findOne({
        _id: req.params.dataSourceId,
        user: req.user._id
      });
      if (!dataSource) {
        return res.status(404).json({ error: 'Data source not found' });
      }
      res.json({
        status: dataSource.status,
        lastSync: dataSource.config.lastSync,
        lastError: dataSource.lastError
      });
    } catch (error) {
      console.error('Error getting sync status:', error);
      res.status(500).json({ error: 'Failed to get sync status' });
    }
  }
};

module.exports = dataSourceController; 