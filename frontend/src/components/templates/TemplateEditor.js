import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTemplate } from '../../context/TemplateContext';

const TemplateEditor = ({ isNew }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTemplate, createTemplate, updateTemplate } = useTemplate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    subject: '',
    content: '',
    category: 'other',
    tags: [],
    variables: []
  });

  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      loadTemplate();
    }
  }, [isNew, id]);

  const loadTemplate = async () => {
    try {
      const template = await getTemplate(id);
      setFormData(template);
    } catch (error) {
      setError('Failed to load template');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isNew) {
        await createTemplate(formData);
      } else {
        await updateTemplate(id, formData);
      }
      navigate('/templates');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {isNew ? 'Create Template' : 'Edit Template'}
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                fullWidth
              />

              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={2}
                fullWidth
              />

              <TextField
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                fullWidth
              />

              <TextField
                label="Content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                multiline
                rows={10}
                required
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <MenuItem value="sales">Sales</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="support">Support</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <TextField
                    size="small"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                  />
                  <Button onClick={handleAddTag}>Add</Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  onClick={() => navigate('/templates')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                >
                  {isNew ? 'Create' : 'Save'}
                </Button>
              </Box>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TemplateEditor; 