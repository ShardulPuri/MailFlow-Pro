import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  useTheme
} from '@mui/material';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { 
  CloudUpload as UploadIcon,
  Google as GoogleIcon,
  Refresh as RefreshIcon,
  Link as LinkIcon
} from '@mui/icons-material';

const EmailUploader = ({ onDataUpload }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState([]);
  const [showSpreadsheetDialog, setShowSpreadsheetDialog] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    checkGoogleConnection();
  }, []);

  const checkGoogleConnection = async () => {
    try {
      const response = await fetch('/api/datasource/sheets/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setGoogleConnected(data.connected);
      if (data.connected) {
        fetchSpreadsheets();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleGoogleConnect = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/datasource/sheets/auth-url', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const { authUrl } = await response.json();
      window.open(authUrl, 'Google Auth', 'width=600,height=600');
      
      window.addEventListener('message', async (event) => {
        if (event.data.type === 'GOOGLE_AUTH_CALLBACK') {
          await handleAuthCallback(event.data.code);
        }
      });
    } catch (error) {
      setError('Failed to connect to Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthCallback = async (code) => {
    try {
      await fetch('/api/datasource/sheets/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code })
      });
      setGoogleConnected(true);
      fetchSpreadsheets();
    } catch (error) {
      setError('Failed to complete authentication');
    }
  };

  const fetchSpreadsheets = async () => {
    try {
      const response = await fetch('/api/datasource/sheets/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const { spreadsheets } = await response.json();
      setSpreadsheets(spreadsheets);
    } catch (error) {
      console.error('Error fetching spreadsheets:', error);
    }
  };

  const handleSpreadsheetSelect = async (spreadsheet) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/datasource/sheets/${spreadsheet.id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ headerRow: 1 })
      });
      const { data } = await response.json();
      onDataUpload(data);
      setShowSpreadsheetDialog(false);
    } catch (error) {
      setError('Failed to load spreadsheet data');
    } finally {
      setLoading(false);
    }
  };

  const validateData = (data) => {
    const requiredFields = ['email'];
    const headers = Object.keys(data[0] || {});
    
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    data.forEach((row, index) => {
      if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        throw new Error(`Invalid email format in row ${index + 1}`);
      }
    });

    return true;
  };

  const onDrop = async (acceptedFiles) => {
    setLoading(true);
    setError(null);

    try {
      const file = acceptedFiles[0];
      
      if (file.type !== 'text/csv') {
        throw new Error('Please upload a CSV file');
      }

      const result = await new Promise((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject
        });
      });

      validateData(result.data);
      onDataUpload(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main }}>
          Upload Recipients Data
        </Typography>

        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab 
            icon={<UploadIcon />} 
            label="CSV Upload" 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            icon={<GoogleIcon />} 
            label="Google Sheets" 
            sx={{ textTransform: 'none' }}
          />
        </Tabs>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {activeTab === 0 && (
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover'
              }
            }}
          >
            <input {...getInputProps()} />
            {loading ? (
              <CircularProgress />
            ) : (
              <>
                <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography>
                  {isDragActive
                    ? 'Drop the CSV file here'
                    : 'Drag and drop a CSV file here, or click to select'}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  CSV must include an 'email' column
                </Typography>
              </>
            )}
          </Box>
        )}

        {activeTab === 1 && (
          <Box sx={{ textAlign: 'center' }}>
            {!googleConnected ? (
              <Button
                variant="contained"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleConnect}
                disabled={loading}
              >
                Connect Google Sheets
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  startIcon={<LinkIcon />}
                  onClick={() => setShowSpreadsheetDialog(true)}
                  sx={{ mr: 2 }}
                >
                  Select Spreadsheet
                </Button>
                <IconButton onClick={fetchSpreadsheets} disabled={loading}>
                  <RefreshIcon />
                </IconButton>
              </>
            )}
          </Box>
        )}

        <Dialog 
          open={showSpreadsheetDialog} 
          onClose={() => setShowSpreadsheetDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Select Spreadsheet</DialogTitle>
          <DialogContent>
            <List>
              {spreadsheets.map((sheet) => (
                <ListItem 
                  key={sheet.id}
                  button
                  onClick={() => handleSpreadsheetSelect(sheet)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                >
                  <ListItemText 
                    primary={sheet.name}
                    secondary={`Last modified: ${new Date(sheet.modifiedTime).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowSpreadsheetDialog(false)}>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EmailUploader; 