import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Paper,
  useTheme,
  Fade,
  Grow
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import EmailUploader from './EmailUploader';
import EmailComposer from './EmailComposer';
import Analytics from './Analytics';
import EmailStatus from './EmailStatus';

const Dashboard = () => {
  const [emailData, setEmailData] = useState([]);
  const [analytics, setAnalytics] = useState({
    totalSent: 0,
    pending: 0,
    scheduled: 0,
    failed: 0,
    responseRate: 0
  });
  const theme = useTheme();

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Fade in timeout={1000}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <EmailIcon 
              sx={{ 
                fontSize: 48, 
                color: 'white',
                mb: 2
              }} 
            />
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{
                fontWeight: 'bold',
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              MailFlow Pro
            </Typography>
          </Box>
        </Fade>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Grow in timeout={1000}>
              <Paper 
                elevation={6}
                sx={{ 
                  p: 3,
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                  },
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <EmailUploader onDataUpload={setEmailData} />
              </Paper>
            </Grow>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Grow in timeout={1500}>
              <Paper 
                elevation={6}
                sx={{ 
                  p: 3,
                  height: '100%',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                  },
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <EmailComposer data={emailData} />
              </Paper>
            </Grow>
          </Grid>

          <Grid item xs={12}>
            <Grow in timeout={2000}>
              <Paper 
                elevation={6}
                sx={{ 
                  p: 3,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                  },
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <Analytics data={analytics} />
              </Paper>
            </Grow>
          </Grid>

          <Grid item xs={12}>
            <Grow in timeout={2500}>
              <Paper 
                elevation={6}
                sx={{ 
                  p: 3,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12],
                  },
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <EmailStatus />
              </Paper>
            </Grow>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard; 