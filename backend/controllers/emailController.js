const Email = require('../models/Email');
const emailService = require('../services/emailService');

const emailController = {
  async sendEmails(req, res) {
    try {
      const { subject, template, provider, data, throttle, scheduleTime } = req.body;
      
      if (!data || data.length === 0) {
        return res.status(400).json({ error: 'No recipient data provided' });
      }

      // Create email documents for each recipient
      const emailPromises = data.map(async (recipient) => {
        try {
          const content = await emailService.generateEmailContent(template, recipient);
          
          return new Email({
            recipient: {
              companyName: recipient.companyName,
              location: recipient.location,
              email: recipient.email,
              products: recipient.products
            },
            subject: emailService.replacePlaceholders(subject, recipient),
            content: content.html,
            plainText: content.text,
            emailProvider: provider,
            status: scheduleTime ? 'scheduled' : 'pending',
            scheduledTime: scheduleTime ? new Date(scheduleTime) : null,
            user: req.user._id
          }).save();
        } catch (error) {
          console.error('Error creating email document:', error);
          return null;
        }
      });

      const emails = (await Promise.all(emailPromises)).filter(email => email !== null);

      if (emails.length === 0) {
        throw new Error('Failed to create any email documents');
      }

      // Start sending emails with throttling
      await emailService.emailQueue.add({
        emails: emails.map(e => e._id),
        throttle,
        userId: req.user._id,
        scheduleTime: scheduleTime ? new Date(scheduleTime) : null
      }, {
        delay: scheduleTime ? new Date(scheduleTime) - new Date() : 0
      });

      res.json({ 
        success: true, 
        emailsQueued: emails.length,
        previewFirst: emails[0]?.content
      });
    } catch (error) {
      console.error('Error sending emails:', error);
      res.status(500).json({ error: error.message || 'Failed to send emails' });
    }
  },

  async getEmailStatus(req, res) {
    try {
      const emails = await Email.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(100);
      
      res.json(emails);
    } catch (error) {
      console.error('Error fetching email status:', error);
      res.status(500).json({ error: 'Failed to fetch email status' });
    }
  },

  async getEmailAnalytics(req, res) {
    try {
      const [
        totalSent,
        pending,
        scheduled,
        failed,
        delivered,
        opened,
        bounced
      ] = await Promise.all([
        Email.countDocuments({ user: req.user._id, status: 'sent' }),
        Email.countDocuments({ user: req.user._id, status: 'pending' }),
        Email.countDocuments({ user: req.user._id, status: 'scheduled' }),
        Email.countDocuments({ user: req.user._id, status: 'failed' }),
        Email.countDocuments({ user: req.user._id, deliveryStatus: 'delivered' }),
        Email.countDocuments({ user: req.user._id, deliveryStatus: 'opened' }),
        Email.countDocuments({ user: req.user._id, deliveryStatus: 'bounced' })
      ]);

      const total = totalSent + pending + scheduled + failed;
      const responseRate = total > 0 ? (opened / total) * 100 : 0;

      res.json({
        totalSent,
        pending,
        scheduled,
        failed,
        responseRate,
        deliveryStatus: {
          delivered,
          opened,
          bounced,
          failed
        }
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  },

  async updateProviderConfig(req, res) {
    try {
      const { provider, config } = req.body;
      await emailService.updateProviderConfig(provider, config);
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating provider config:', error);
      res.status(500).json({ error: 'Failed to update provider config' });
    }
  },

  async getProviderStatus(req, res) {
    try {
      const status = await emailService.getProviderStatus();
      res.json(status);
    } catch (error) {
      console.error('Error fetching provider status:', error);
      res.status(500).json({ error: 'Failed to fetch provider status' });
    }
  }
};

module.exports = emailController; 