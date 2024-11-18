import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    defaultThrottle: user?.settings?.defaultThrottle || 50,
    defaultProvider: user?.settings?.defaultProvider || 'sendgrid'
  });

  const [providerConfig, setProviderConfig] = useState({
    apiKey: '',
    clientId: '',
    clientSecret: '',
    refreshToken: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validate password change if attempted
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error('New passwords do not match');
        }
        if (!formData.currentPassword) {
          throw new Error('Current password is required to change password');
        }
      }

      const updates = {
        name: formData.name,
        settings: {
          defaultThrottle: formData.defaultThrottle,
          defaultProvider: formData.defaultProvider
        }
      };

      if (formData.newPassword) {
        updates.password = formData.newPassword;
        updates.currentPassword = formData.currentPassword;
      }

      await updateProfile(updates);
      setSuccess('Profile updated successfully');
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSubmit = async () => {
    try {
      const response = await fetch('/api/auth/provider/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          provider: selectedProvider,
          credentials: providerConfig
        })
      });

      if (!response.ok) throw new Error('Failed to configure provider');

      setSuccess(`${selectedProvider} configured successfully`);
      setShowProviderDialog(false);
      setProviderConfig({
        apiKey: '',
        clientId: '',
        clientSecret: '',
        refreshToken: ''
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Profile Settings
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <form onSubmit={handleSubmit}>
                <TextField
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>

                <TextField
                  label="Current Password"
                  name="currentPassword"
                  type="password"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />

                <TextField
                  label="New Password"
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />

                <TextField
                  label="Confirm New Password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Settings
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Default Email Provider</InputLabel>
                <Select
                  name="defaultProvider"
                  value={formData.defaultProvider}
                  onChange={handleChange}
                >
                  <MenuItem value="sendgrid">SendGrid</MenuItem>
                  <MenuItem value="gmail">Gmail</MenuItem>
                  <MenuItem value="outlook">Outlook</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Default Emails per Hour"
                name="defaultThrottle"
                type="number"
                value={formData.defaultThrottle}
                onChange={handleChange}
                fullWidth
                margin="normal"
              />

              <Button
                variant="outlined"
                onClick={() => setShowProviderDialog(true)}
                sx={{ mt: 2 }}
              >
                Configure Email Provider
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Email Provider Configuration Dialog */}
      <Dialog open={showProviderDialog} onClose={() => setShowProviderDialog(false)}>
        <DialogTitle>Configure Email Provider</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Provider</InputLabel>
            <Select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
            >
              <MenuItem value="sendgrid">SendGrid</MenuItem>
              <MenuItem value="gmail">Gmail</MenuItem>
              <MenuItem value="outlook">Outlook</MenuItem>
            </Select>
          </FormControl>

          {selectedProvider === 'sendgrid' && (
            <TextField
              label="API Key"
              value={providerConfig.apiKey}
              onChange={(e) => setProviderConfig({ ...providerConfig, apiKey: e.target.value })}
              fullWidth
              margin="normal"
            />
          )}

          {(selectedProvider === 'gmail' || selectedProvider === 'outlook') && (
            <>
              <TextField
                label="Client ID"
                value={providerConfig.clientId}
                onChange={(e) => setProviderConfig({ ...providerConfig, clientId: e.target.value })}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Client Secret"
                value={providerConfig.clientSecret}
                onChange={(e) => setProviderConfig({ ...providerConfig, clientSecret: e.target.value })}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Refresh Token"
                value={providerConfig.refreshToken}
                onChange={(e) => setProviderConfig({ ...providerConfig, refreshToken: e.target.value })}
                fullWidth
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowProviderDialog(false)}>Cancel</Button>
          <Button onClick={handleProviderSubmit} variant="contained">
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 