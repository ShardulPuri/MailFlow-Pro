import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  useTheme,
  Paper,
  Divider
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Send as SendIcon, Schedule as ScheduleIcon } from '@mui/icons-material';

const EmailComposer = ({ data }) => {
  const [subject, setSubject] = useState('');
  const [template, setTemplate] = useState('');
  const [provider, setProvider] = useState('sendgrid');
  const [scheduleTime, setScheduleTime] = useState(null);
  const [throttle, setThrottle] = useState(50);
  const [showSchedule, setShowSchedule] = useState(false);
  const [availableFields, setAvailableFields] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  React.useEffect(() => {
    if (data && data.length > 0) {
      const fields = Object.keys(data[0]);
      setAvailableFields(fields);
    }
  }, [data]);

  const handleInsertField = (field) => {
    setTemplate(template + `{${field}}`);
  };

  const validateTemplate = (template, data) => {
    const placeholders = template.match(/\{\{[^}]+\}\}/g) || [];
    const availableFields = Object.keys(data[0] || {});
    
    const missingFields = [];
    placeholders.forEach(placeholder => {
      const field = placeholder.replace(/\{\{|\}\}/g, '').trim();
      if (!availableFields.includes(field)) {
        missingFields.push(field);
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  const handleSend = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (!data || data.length === 0) {
        throw new Error('No recipients data available');
      }

      const validation = validateTemplate(template, data);
      if (!validation.isValid) {
        throw new Error(`Missing fields in CSV: ${validation.missingFields.join(', ')}`);
      }

      const payload = {
        subject,
        template,
        provider,
        scheduleTime,
        throttle,
        data
      };

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send emails');
      }

      const result = await response.json();
      setSuccess(`Successfully queued ${result.emailsQueued} emails`);
      
      // Reset form
      setSubject('');
      setTemplate('');
      setScheduleTime(null);
    } catch (error) {
      console.error('Error sending emails:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            color: theme.palette.primary.main,
            fontWeight: 'bold',
            mb: 3
          }}
        >
          Compose Email Campaign
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              '& .MuiAlert-message': { width: '100%' }
            }}
          >
            {success}
          </Alert>
        )}

        <Stack spacing={3}>
          <TextField
            label="Subject Line"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            required
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
              },
            }}
          />

          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1
            }}
          >
            <Typography variant="subtitle2" gutterBottom color="textSecondary">
              Available Fields
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {availableFields.map((field) => (
                <Chip
                  key={field}
                  label={field}
                  onClick={() => handleInsertField(field)}
                  clickable
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: theme.palette.primary.light,
                      color: 'white'
                    }
                  }}
                />
              ))}
            </Box>

            <TextField
              label="Email Template"
              multiline
              rows={8}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              fullWidth
              required
              helperText="Use {field} to insert recipient data"
              sx={{ mb: 2 }}
            />
          </Paper>

          <Divider />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Email Provider</InputLabel>
              <Select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="sendgrid">SendGrid</MenuItem>
                <MenuItem value="gmail">Gmail</MenuItem>
                <MenuItem value="outlook">Outlook</MenuItem>
              </Select>
            </FormControl>

            <TextField
              type="number"
              label="Emails per hour"
              value={throttle}
              onChange={(e) => setThrottle(e.target.value)}
              inputProps={{ min: 1, max: 1000 }}
              sx={{ minWidth: 150 }}
            />
          </Box>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2, 
            mt: 3 
          }}>
            <Button
              variant="outlined"
              onClick={() => setShowSchedule(true)}
              disabled={loading}
              startIcon={<ScheduleIcon />}
            >
              Schedule
            </Button>
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={loading || !template || !subject || !data?.length}
              startIcon={<SendIcon />}
              sx={{
                minWidth: 150,
                background: theme.palette.primary.main,
                '&:hover': {
                  background: theme.palette.primary.dark,
                }
              }}
            >
              {loading ? 'Sending...' : 'Send Campaign'}
            </Button>
          </Box>
        </Stack>

        <Dialog 
          open={showSchedule} 
          onClose={() => setShowSchedule(false)}
          PaperProps={{
            sx: { minWidth: 400 }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            pb: 2
          }}>
            Schedule Campaign
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Schedule Time"
                value={scheduleTime}
                onChange={setScheduleTime}
                minDateTime={new Date()}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setShowSchedule(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => setShowSchedule(false)} 
              variant="contained"
              color="primary"
            >
              Confirm Schedule
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default EmailComposer; 