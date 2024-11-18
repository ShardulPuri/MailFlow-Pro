const Template = require('../models/Template');
const emailService = require('../services/emailService');

const templateController = {
  async createTemplate(req, res) {
    try {
      const { name, description, subject, content, category, tags, variables } = req.body;

      // Validate template content with sample data
      const validation = await emailService.validateTemplate(content, {
        companyName: 'Sample Company',
        email: 'sample@example.com',
        location: 'Sample Location'
      });

      if (!validation.isValid) {
        return res.status(400).json({ error: 'Invalid template content', details: validation.error });
      }

      const template = await Template.create({
        user: req.user._id,
        name,
        description,
        subject,
        content,
        category,
        tags,
        variables
      });

      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  },

  async getTemplates(req, res) {
    try {
      const { category, search, shared } = req.query;
      let query = { $or: [{ user: req.user._id }] };

      if (shared) {
        query.$or.push({ isShared: true });
      }

      if (category) {
        query.category = category;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      const templates = await Template.find(query)
        .sort({ updatedAt: -1 });

      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  },

  async getTemplate(req, res) {
    try {
      const template = await Template.findOne({
        _id: req.params.id,
        $or: [
          { user: req.user._id },
          { isShared: true }
        ]
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  },

  async updateTemplate(req, res) {
    try {
      const { name, description, subject, content, category, tags, variables, isShared } = req.body;

      if (content) {
        // Validate new content if provided
        const validation = await emailService.validateTemplate(content, {
          companyName: 'Sample Company',
          email: 'sample@example.com',
          location: 'Sample Location'
        });

        if (!validation.isValid) {
          return res.status(400).json({ error: 'Invalid template content', details: validation.error });
        }
      }

      const template = await Template.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        {
          name,
          description,
          subject,
          content,
          category,
          tags,
          variables,
          isShared
        },
        { new: true }
      );

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  },

  async deleteTemplate(req, res) {
    try {
      const template = await Template.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  },

  async updateTemplateStats(req, res) {
    try {
      const { responseRate } = req.body;
      
      const template = await Template.findById(req.params.id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      // Update statistics
      template.stats.timesUsed += 1;
      template.stats.avgResponseRate = (
        (template.stats.avgResponseRate * (template.stats.timesUsed - 1) + responseRate) /
        template.stats.timesUsed
      );
      template.lastUsed = new Date();

      await template.save();
      res.json(template);
    } catch (error) {
      console.error('Error updating template stats:', error);
      res.status(500).json({ error: 'Failed to update template stats' });
    }
  }
};

module.exports = templateController; 