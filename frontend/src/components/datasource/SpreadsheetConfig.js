import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

const SpreadsheetConfig = ({ spreadsheet, onConfigured }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheets, setSheets] = useState([]);
  const [config, setConfig] = useState({
    name: '',
    sheetName: '',
    range: '',
    headerRow: 1,
    columnMappings: {}
  });
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (spreadsheet) {
      fetchSheetMetadata();
    }
  }, [spreadsheet,fetchSheetMetadata]);

  const fetchSheetMetadata = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/datasource/sheets/${spreadsheet.id}/metadata`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const { metadata } = await response.json();
      setSheets(metadata);
    } catch (error) {
      setError('Failed to fetch sheet metadata');
      console.error('Metadata error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSheetSelect = async (sheetName) => {
    setConfig({ ...config, sheetName });
    await fetchPreview(sheetName);
  };

  const fetchPreview = async (sheetName) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/datasource/sheets/${spreadsheet.id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sheetName,
          headerRow: config.headerRow
        })
      });
      const { data } = await response.json();
      setPreviewData(data);
    } catch (error) {
      setError('Failed to fetch preview data');
    } finally {
      setLoading(false);
    }
  };

  const handleColumnMapping = (originalColumn, mappedColumn) => {
    setConfig({
      ...config,
      columnMappings: {
        ...config.columnMappings,
        [originalColumn]: mappedColumn
      }
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/datasource/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: config.name,
          type: 'google_sheets',
          config: {
            spreadsheetId: spreadsheet.id,
            sheetName: config.sheetName,
            range: config.range,
            headerRow: config.headerRow,
            columnMappings: config.columnMappings
          }
        })
      });

      if (!response.ok) throw new Error('Failed to save configuration');

      const data = await response.json();
      onConfigured && onConfigured(data.dataSource);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Configure Spreadsheet
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Configuration Name"
            name="name"
            value={config.name}
            onChange={handleChange}
            required
          />

          <FormControl fullWidth>
            <InputLabel>Sheet</InputLabel>
            <Select
              value={config.sheetName}
              onChange={(e) => handleSheetSelect(e.target.value)}
            >
              {sheets.map((sheet) => (
                <MenuItem key={sheet.sheetId} value={sheet.title}>
                  {sheet.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Range (e.g., A1:F100)"
            name="range"
            value={config.range}
            onChange={handleChange}
            placeholder="Leave empty for entire sheet"
          />

          <TextField
            label="Header Row"
            name="headerRow"
            type="number"
            value={config.headerRow}
            onChange={handleChange}
            inputProps={{ min: 1 }}
          />

          {previewData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Column Mapping
              </Typography>
              
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sheet Column</TableCell>
                      <TableCell>Map To</TableCell>
                      <TableCell>Preview</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.keys(previewData[0] || {}).map((column) => (
                      <TableRow key={column}>
                        <TableCell>{column}</TableCell>
                        <TableCell>
                          <Select
                            value={config.columnMappings[column] || ''}
                            onChange={(e) => handleColumnMapping(column, e.target.value)}
                            size="small"
                          >
                            <MenuItem value="">Don't map</MenuItem>
                            <MenuItem value="email">Email</MenuItem>
                            <MenuItem value="companyName">Company Name</MenuItem>
                            <MenuItem value="location">Location</MenuItem>
                            <MenuItem value="products">Products</MenuItem>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {previewData[0][column]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading || !config.name || !config.sheetName}
          >
            {loading ? <CircularProgress size={24} /> : 'Save Configuration'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetConfig; 