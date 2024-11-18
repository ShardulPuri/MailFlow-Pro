import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import { Refresh as RefreshIcon, Link as LinkIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const GoogleSheetsConnect = ({ onConnected }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const [spreadsheets, setSpreadsheets] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/datasource/sheets/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setConnected(data.connected);
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
      
      // Open in new window
      window.location.href = authUrl;
      
    } catch (error) {
      setError('Failed to connect to Google Sheets');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthCallback = async (code) => {
    try {
      const response = await fetch('/api/datasource/sheets/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) throw new Error('Failed to complete authentication');

      setConnected(true);
      onConnected && onConnected();
      await fetchSpreadsheets();
    } catch (error) {
      setError(error.message);
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

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Google Sheets Connection
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!connected ? (
          <Button
            variant="contained"
            onClick={handleGoogleConnect}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <LinkIcon />}
          >
            {loading ? 'Connecting...' : 'Connect Google Sheets'}
          </Button>
        ) : (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Connected to Google Sheets
            </Alert>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Available Spreadsheets
              </Typography>
              <IconButton onClick={fetchSpreadsheets} size="small" sx={{ ml: 1 }}>
                <RefreshIcon />
              </IconButton>
            </Box>

            <List>
              {spreadsheets.map((sheet) => (
                <ListItem
                  key={sheet.id}
                  button
                  onClick={() => onConnected && onConnected(sheet)}
                >
                  <ListItemText
                    primary={sheet.name}
                    secondary={`Last modified: ${new Date(sheet.modifiedTime).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleSheetsConnect; 