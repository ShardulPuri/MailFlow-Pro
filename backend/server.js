require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Redis = require('ioredis');
const emailRoutes = require('./routes/emailRoutes');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const auth = require('./middleware/auth');
const dataSourceRoutes = require('./routes/dataSourceRoutes');
const templateRoutes = require('./routes/templateRoutes');
require('./services/queueProcessor');
const Email = require('./models/Email');

const app = express();

// Add this near the top with other requires
app.post('/api/email/webhook', 
  express.raw({type: 'application/json'}), 
  async (req, res) => {
    console.log('====== WEBHOOK REQUEST RECEIVED ======');
    
    try {
        const rawBody = req.body?.toString() || '{}';
        const events = JSON.parse(rawBody);
        const eventArray = Array.isArray(events) ? events : [events];
        
        console.log('Parsed webhook events:', JSON.stringify(eventArray, null, 2));
        
        for (const event of eventArray) {
            console.log(`Processing ${event.event} event for ${event.email}`);

            if (event.event === 'open') {
                // Find all emails in the queue for this recipient
                const emails = await Email.find({
                    'recipient.email': event.email,
                    status: 'sent',
                    deliveryStatus: { $in: ['delivered', 'pending'] }, // Include both delivered and pending
                    sentTime: { 
                        // Look for emails sent in the last 24 hours
                        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                });

                console.log(`Found ${emails.length} queued emails for recipient ${event.email}`);

                // Update each email in the queue
                for (const email of emails) {
                    try {
                        const updatedEmail = await Email.findByIdAndUpdate(
                            email._id,
                            {
                                deliveryStatus: 'opened',
                                openTime: new Date()
                            },
                            { new: true }
                        );
                        console.log(`Updated queued email ${email._id} status to opened`);
                    } catch (updateError) {
                        console.error(`Error updating email ${email._id}:`, updateError);
                    }
                }

                // Verify updates
                const verifyEmails = await Email.find({
                    'recipient.email': event.email,
                    deliveryStatus: 'opened'
                });
                
                console.log('Queue Update Verification:', {
                    recipient: event.email,
                    totalFound: emails.length,
                    totalUpdated: verifyEmails.length,
                    updatedIds: verifyEmails.map(e => e._id)
                });
            }
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).send('Error processing webhook');
    }
});

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Middleware
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB successfully');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Add this to see more detailed errors
mongoose.set('debug', true);

// Redis connection
const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => {
  console.log('Connected to Redis successfully');
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something broke!' });
});

// Routes
app.use('/api/email', auth, emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/analytics', auth, analyticsRoutes);
app.use('/api/datasource', auth, dataSourceRoutes);
app.use('/api/templates', auth, templateRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.info('SIGTERM signal received.');
  redis.quit();
  mongoose.connection.close();
}); 