const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');
const { Groq } = require('groq-sdk');
const Queue = require('bull');
const Email = require('../models/Email');

class EmailService {
  constructor() {
    this.emailQueue = new Queue('email-queue', process.env.REDIS_URL);
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    // Set up email providers
    this.providers = {
      sendgrid: this.sendWithSendGrid.bind(this),
      gmail: this.sendWithGmail.bind(this),
      outlook: this.sendWithOutlook.bind(this)
    };
  }

  async generateEmailContent(template, recipientData) {
    try {
      // Pre-process template to replace placeholders before AI processing
      let processedTemplate = this.replacePlaceholders(template, recipientData);

      const systemPrompt = `You are a professional email writer. Generate a personalized email based on the template below.
        The email should be:
        1. Professional and courteous
        2. Properly formatted with HTML
        3. Keep all existing personalization
        4. Maintain the core message of the template
        
        Important: Do not modify or remove any actual values that have replaced placeholders.
        
        Recipient Data:
        ${JSON.stringify(recipientData, null, 2)}`;

      // Generate customized content using Groq
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Generate a personalized email based on this template: ${processedTemplate}`
          }
        ],
        model: 'mixtral-8x7b-32768',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 0.9
      });

      let generatedContent = completion.choices[0].message.content;

      // Verify all placeholders were replaced
      const remainingPlaceholders = generatedContent.match(/\{\{[^}]+\}\}/g) || [];
      if (remainingPlaceholders.length > 0) {
        console.warn('Found unreplaced placeholders:', remainingPlaceholders);
        // Do one final replacement pass
        generatedContent = this.replacePlaceholders(generatedContent, recipientData);
      }

      // Ensure proper HTML formatting
      if (!generatedContent.includes('<html>')) {
        generatedContent = `
          <html>
            <body>
              ${generatedContent.split('\n').map(line => `<p>${line}</p>`).join('')}
            </body>
          </html>
        `;
      }

      return {
        html: generatedContent,
        text: this.stripHtml(generatedContent)
      };
    } catch (error) {
      console.error('Error generating email content:', error);
      throw new Error('Failed to generate email content');
    }
  }

  replacePlaceholders(template, data) {
    // First, handle double-curly brace placeholders
    let processedTemplate = template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const value = key.split('.').reduce((obj, k) => obj?.[k], data);
      return value !== undefined ? value : match; // Keep original if no value found
    });

    // Then handle single-curly brace placeholders
    processedTemplate = processedTemplate.replace(/\{([^}]+)\}/g, (match, key) => {
      const value = key.split('.').reduce((obj, k) => obj?.[k], data);
      return value !== undefined ? value : match; // Keep original if no value found
    });

    // Log replacement for debugging
    console.log('Placeholder replacement:', {
      original: template,
      data: data,
      result: processedTemplate
    });

    return processedTemplate;
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  async sendEmail(emailData) {
    const sendFunction = this.providers[emailData.provider];
    if (!sendFunction) {
      throw new Error(`Unsupported email provider: ${emailData.provider}`);
    }
    return sendFunction(emailData);
  }

  async sendWithSendGrid(emailData) {
    try {
      console.log('=== SENDING EMAIL WITH SENDGRID ===');
      console.log('SendGrid Configuration:', {
        apiKey: process.env.SENDGRID_API_KEY ? 'Present' : 'Missing',
        fromEmail: process.env.SENDGRID_FROM_EMAIL,
      });

      console.log('Email Data:', {
        to: emailData.to,
        subject: emailData.subject,
        contentLength: emailData.content?.length,
        emailId: emailData.emailId
      });

      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SendGrid API key not configured');
      }

      if (!process.env.SENDGRID_FROM_EMAIL) {
        throw new Error('SendGrid sender email not configured');
      }

      const msg = {
        to: emailData.to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: emailData.subject,
        html: emailData.content,
        text: emailData.plainText,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
          subscriptionTracking: { enable: false },
          ganalytics: { enable: false }
        }
      };

      console.log('Attempting to send email with configuration:', {
        to: msg.to,
        from: msg.from,
        subject: msg.subject,
        trackingSettings: msg.trackingSettings
      });

      const response = await sgMail.send(msg);
      console.log('SendGrid API Response:', response[0]?.statusCode);
      
      // Store SendGrid message ID
      await Email.findByIdAndUpdate(emailData.emailId, {
        status: 'sent',
        deliveryStatus: 'delivered',
        sentTime: new Date(),
        'messageId': response[0]?.headers['x-message-id']
      });

      console.log('Email status updated successfully');
      return true;
    } catch (error) {
      console.error('SendGrid Error Details:', {
        message: error.message,
        response: error.response?.body,
        code: error.code,
        to: emailData.to
      });
      throw error;
    }
  }

  async sendWithGmail(emailData) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN
      }
    });

    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.content,
        text: emailData.plainText
      });
      return true;
    } catch (error) {
      console.error('Gmail error:', error);
      throw error;
    }
  }

  async sendWithOutlook(emailData) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.OUTLOOK_USER,
        pass: process.env.OUTLOOK_PASSWORD
      }
    });

    try {
      await transporter.sendMail({
        from: process.env.OUTLOOK_USER,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.content,
        text: emailData.plainText
      });
      return true;
    } catch (error) {
      console.error('Outlook error:', error);
      throw error;
    }
  }

  async validateTemplate(template, sampleData) {
    try {
      const result = await this.generateEmailContent(template, sampleData);
      return {
        isValid: true,
        preview: result.html,
        placeholders: this.extractPlaceholders(template)
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
        placeholders: this.extractPlaceholders(template)
      };
    }
  }

  extractPlaceholders(template) {
    const matches = template.match(/\{([\w.]+)\}/g) || [];
    return matches.map(match => match.slice(1, -1));
  }

  async updateProviderConfig(provider, config) {
    switch (provider) {
      case 'sendgrid':
        sgMail.setApiKey(config.apiKey);
        break;
      // Add other provider configurations as needed
    }
  }

  async getProviderStatus() {
    return {
      sendgrid: await this.checkSendGridStatus(),
      gmail: await this.checkGmailStatus(),
      outlook: await this.checkOutlookStatus()
    };
  }

  async checkSendGridStatus() {
    try {
      await sgMail.send({
        to: 'test@example.com',
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Test',
        text: 'Test',
        mailSettings: {
          sandboxMode: {
            enable: true
          }
        }
      });
      return 'connected';
    } catch (error) {
      return 'error';
    }
  }

  async checkGmailStatus() {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: process.env.GMAIL_USER,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN
        }
      });
      await transporter.verify();
      return 'connected';
    } catch (error) {
      return 'error';
    }
  }

  async checkOutlookStatus() {
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.OUTLOOK_USER,
          pass: process.env.OUTLOOK_PASSWORD
        }
      });
      await transporter.verify();
      return 'connected';
    } catch (error) {
      return 'error';
    }
  }

  validatePlaceholders(template, sampleData) {
    const placeholders = template.match(/\{\{[^}]+\}\}/g) || [];
    const missingFields = [];

    placeholders.forEach(placeholder => {
      const key = placeholder.replace(/\{\{|\}\}/g, '').trim();
      const value = key.split('.').reduce((obj, k) => obj?.[k], sampleData);
      if (value === undefined) {
        missingFields.push(key);
      }
    });

    return {
      isValid: missingFields.length === 0,
      missingFields,
      placeholders
    };
  }

  async handleEmailEvent(event) {
    try {
      const emailId = event.customArgs?.emailId || event.sg_message_id;
      console.log('Handling email event:', {
        eventType: event.event,
        emailId,
        timestamp: event.timestamp,
        email: event.email
      });
      
      if (!emailId) {
        console.warn('No emailId found for event:', event);
        return;
      }

      // Find email by ID or message ID
      const email = await Email.findOne({
        $or: [
          { _id: emailId },
          { 'messageId': event.sg_message_id }
        ]
      });

      if (!email) {
        console.warn('Email not found for ID:', emailId);
        return;
      }

      switch(event.event) {
        case 'open':
          const updatedEmail = await Email.findByIdAndUpdate(
            email._id,
            {
              deliveryStatus: 'opened',
              openTime: new Date(event.timestamp * 1000)
            },
            { new: true }
          );
          
          console.log('Updated email status to opened:', {
            emailId: email._id,
            newStatus: updatedEmail.deliveryStatus,
            openTime: updatedEmail.openTime
          });
          break;
          
        case 'delivered':
          await Email.findByIdAndUpdate(email._id, {
            deliveryStatus: 'delivered',
            deliveredTime: new Date(event.timestamp * 1000)
          });
          break;
          
        case 'bounce':
          await Email.findByIdAndUpdate(email._id, {
            deliveryStatus: 'bounced',
            lastError: event.reason
          });
          break;

        default:
          console.log('Unhandled event type:', event.event);
      }
    } catch (error) {
      console.error('Error handling email event:', error);
    }
  }
}

module.exports = new EmailService(); 