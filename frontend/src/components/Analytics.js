import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  LinearProgress
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

const StatCard = ({ title, value, color, icon: Icon }) => (
  <Card
    sx={{
      height: '100%',
      transition: 'transform 0.3s, box-shadow 0.3s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 6,
      },
      background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, white 100%)`
    }}
  >
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {Icon && <Icon sx={{ color, mr: 1 }} />}
        <Typography color="textSecondary">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ 
        color,
        fontWeight: 'bold',
        textShadow: `1px 1px 2px ${alpha(color, 0.2)}`
      }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

const Analytics = ({ data }) => {
  const [analyticsData, setAnalyticsData] = useState(data);
  const theme = useTheme();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const newData = await response.json();
        setAnalyticsData(newData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    };

    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const {
    totalSent,
    pending,
    scheduled,
    failed,
    responseRate,
    deliveryStatus = {}
  } = analyticsData || data;

  const pieData = [
    { name: 'Delivered', value: deliveryStatus.delivered || 0 },
    { name: 'Opened', value: deliveryStatus.opened || 0 },
    { name: 'Bounced', value: deliveryStatus.bounced || 0 },
    { name: 'Failed', value: deliveryStatus.failed || 0 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Email Analytics
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <StatCard title="Total Sent" value={totalSent} color="#0088FE" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard title="Pending" value={pending} color="#00C49F" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard title="Scheduled" value={scheduled} color="#FFBB28" />
          </Grid>
          <Grid item xs={12} md={3}>
            <StatCard title="Failed" value={failed} color="#FF8042" />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[analyticsData]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha('#000', 0.1)} />
                  <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`
                    }}
                  />
                  <Bar dataKey="totalSent" fill="#0088FE" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="#00C49F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="#FF8042" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Response Rate: {responseRate}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={responseRate || 0}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Analytics; 