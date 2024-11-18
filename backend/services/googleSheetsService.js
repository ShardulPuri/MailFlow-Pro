const { google } = require('googleapis');
const DataSource = require('../models/DataSource');

class GoogleSheetsService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    this.sheets = google.sheets({ version: 'v4' });
  }

  async getAuthUrl() {
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/drive.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  async handleCallback(code, userId) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Store the refresh token
      await DataSource.findOneAndUpdate(
        { user: userId, type: 'google_sheets' },
        {
          $set: {
            'config.refreshToken': tokens.refresh_token,
            status: 'active'
          }
        },
        { upsert: true }
      );

      return tokens;
    } catch (error) {
      console.error('Error handling Google callback:', error);
      throw error;
    }
  }

  async getSpreadsheetData(dataSourceId) {
    try {
      const dataSource = await DataSource.findById(dataSourceId);
      if (!dataSource) throw new Error('Data source not found');

      // Set up authentication
      this.oauth2Client.setCredentials({
        refresh_token: dataSource.config.refreshToken
      });

      // Get spreadsheet data
      const response = await this.sheets.spreadsheets.values.get({
        auth: this.oauth2Client,
        spreadsheetId: dataSource.config.spreadsheetId,
        range: `${dataSource.config.sheetName}!${dataSource.config.range}`
      });

      const rows = response.data.values;
      if (!rows || rows.length === 0) {
        throw new Error('No data found in spreadsheet');
      }

      // Process the data using column mappings
      const headers = rows[dataSource.config.headerRow - 1];
      const data = rows.slice(dataSource.config.headerRow).map(row => {
        const rowData = {};
        headers.forEach((header, index) => {
          const mappedField = dataSource.config.columnMappings.get(header);
          if (mappedField) {
            rowData[mappedField] = row[index];
          }
        });
        return rowData;
      });

      // Update last sync info
      await DataSource.findByIdAndUpdate(dataSourceId, {
        lastSync: new Date(),
        lastSyncData: data,
        status: 'active',
        lastError: null
      });

      return data;
    } catch (error) {
      console.error('Error fetching spreadsheet data:', error);
      
      await DataSource.findByIdAndUpdate(dataSourceId, {
        status: 'error',
        lastError: error.message
      });
      
      throw error;
    }
  }

  async listSpreadsheets(refreshToken) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      const response = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.spreadsheet'",
        fields: 'files(id, name)'
      });

      return response.data.files;
    } catch (error) {
      console.error('Error listing spreadsheets:', error);
      throw error;
    }
  }

  async getSpreadsheetMetadata(spreadsheetId, refreshToken) {
    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const response = await this.sheets.spreadsheets.get({
        auth: this.oauth2Client,
        spreadsheetId,
        fields: 'sheets.properties'
      });

      return response.data.sheets.map(sheet => ({
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        gridProperties: sheet.properties.gridProperties
      }));
    } catch (error) {
      console.error('Error getting spreadsheet metadata:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService(); 