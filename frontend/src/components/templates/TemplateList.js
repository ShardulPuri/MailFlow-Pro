import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTemplate } from '../../context/TemplateContext';

const TemplateList = () => {
  const { templates, fetchTemplates, deleteTemplate } = useTemplate();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Email Templates</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/templates/new')}
        >
          Create Template
        </Button>
      </Box>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} key={template._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">{template.name}</Typography>
                  <Box>
                    <IconButton onClick={() => navigate(`/templates/${template._id}`)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(template._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography color="textSecondary" gutterBottom>
                  {template.description}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={template.category}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {template.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default TemplateList; 