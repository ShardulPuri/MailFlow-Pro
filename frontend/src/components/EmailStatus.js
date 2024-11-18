import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Box,
  useTheme,
  tableCellClasses,
  styled
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

// Styled components for better table appearance
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 'bold',
    fontSize: '0.95rem'
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: '0.9rem'
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.2s ease'
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const statusColors = {
  pending: 'warning',
  sent: 'success',
  failed: 'error',
  scheduled: 'info',
  delivered: 'success',
  opened: 'success',
  bounced: 'error'
};

const EmailStatus = () => {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setEmails(data || []);
    } catch (error) {
      console.error('Error fetching email status:', error);
      setEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card elevation={3}>
      <CardContent>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold',
              color: theme.palette.primary.main
            }}
          >
            Email Status
          </Typography>
          <Tooltip title="Refresh">
            <IconButton 
              onClick={fetchEmails} 
              disabled={loading}
              sx={{
                '&:hover': {
                  backgroundColor: theme.palette.primary.light,
                  color: theme.palette.common.white
                }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{ 
            maxHeight: 440,
            '&::-webkit-scrollbar': {
              width: 10,
              height: 10
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.primary.light,
              borderRadius: 2
            }
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <StyledTableCell>Recipient</StyledTableCell>
                <StyledTableCell>Subject</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell>Delivery Status</StyledTableCell>
                <StyledTableCell>Opened</StyledTableCell>
                <StyledTableCell>Scheduled Time</StyledTableCell>
                <StyledTableCell>Sent Time</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(emails) && emails.map((email) => (
                <StyledTableRow key={email._id}>
                  <StyledTableCell>{email.recipient?.email}</StyledTableCell>
                  <StyledTableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Tooltip title={email.subject}>
                      <span>{email.subject}</span>
                    </Tooltip>
                  </StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={email.status}
                      color={statusColors[email.status] || 'default'}
                      size="small"
                      sx={{ 
                        fontWeight: 'bold',
                        minWidth: 80,
                        '& .MuiChip-label': {
                          px: 2
                        }
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={email.deliveryStatus}
                      color={statusColors[email.deliveryStatus] || 'default'}
                      size="small"
                      sx={{ 
                        fontWeight: 'bold',
                        minWidth: 80,
                        '& .MuiChip-label': {
                          px: 2
                        }
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={email.deliveryStatus === 'opened' ? 'Yes' : 'No'}
                      color={email.deliveryStatus === 'opened' ? 'success' : 'default'}
                      size="small"
                      sx={{ 
                        fontWeight: 'bold',
                        minWidth: 60,
                        '& .MuiChip-label': {
                          px: 2
                        }
                      }}
                    />
                  </StyledTableCell>
                  <StyledTableCell>
                    {email.scheduledTime && new Date(email.scheduledTime).toLocaleString()}
                  </StyledTableCell>
                  <StyledTableCell>
                    {email.sentTime && new Date(email.sentTime).toLocaleString()}
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default EmailStatus; 