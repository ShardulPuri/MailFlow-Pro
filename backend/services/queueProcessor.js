const Queue = require('bull');
const Email = require('../models/Email');
const emailService = require('./emailService');

const emailQueue = new Queue('email-queue', process.env.REDIS_URL);

emailQueue.process(async (job) => {
  const { emails, throttle, scheduleTime } = job.data;
  
  // Calculate delay between emails based on throttle
  const delayMs = Math.floor(3600000 / throttle); // Convert hourly rate to ms delay

  for (const emailId of emails) {
    try {
      const email = await Email.findById(emailId);
      
      if (!email) continue;

      // Check if it's time to send scheduled email
      if (email.scheduledTime) {
        const now = new Date();
        const scheduledTime = new Date(email.scheduledTime);
        
        if (now < scheduledTime) {
          console.log(`Skipping email ${emailId} - scheduled for ${scheduledTime}`);
          continue; // Skip this email if it's not time yet
        }
      }

      // Send email
      await emailService.sendEmail({
        to: email.recipient.email,
        subject: email.subject,
        content: email.content,
        plainText: email.plainText,
        provider: email.emailProvider
      });

      // Update email status
      email.status = 'sent';
      email.sentTime = new Date();
      email.deliveryStatus = 'delivered';
      await email.save();

      console.log(`Email sent successfully to ${email.recipient.email}`);

      // Wait before sending next email
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      console.error(`Failed to send email ${emailId}:`, error);
      
      // Update email status to failed
      await Email.findByIdAndUpdate(emailId, {
        status: 'failed',
        deliveryStatus: 'failed',
        lastError: error.message
      });
    }
  }
});

// Add scheduled job processing
emailQueue.on('completed', async (job) => {
  console.log(`Job ${job.id} completed`);
  
  // Check for any remaining scheduled emails
  const scheduledEmails = await Email.find({ status: 'scheduled' });
  
  for (const email of scheduledEmails) {
    const delay = new Date(email.scheduledTime) - new Date();
    if (delay > 0) {
      await emailQueue.add({
        emails: [email._id],
        throttle: 1, // Send one at a time for scheduled emails
        scheduleTime: email.scheduledTime
      }, {
        delay,
        jobId: `scheduled-${email._id}`
      });
    }
  }
});

emailQueue.on('failed', async (job, error) => {
  console.error('Job failed:', error);
  
  const { emails } = job.data;
  await Email.updateMany(
    { _id: { $in: emails } },
    { 
      status: 'failed', 
      deliveryStatus: 'failed',
      lastError: error.message
    }
  );
});

emailQueue.on('active', (job) => {
  console.log(`Job ${job.id} started processing`);
});

emailQueue.on('progress', (job, progress) => {
  console.log(`Job ${job.id} is ${progress}% complete`);
});

module.exports = emailQueue; 