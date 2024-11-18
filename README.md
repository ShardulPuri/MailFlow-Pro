# Email Campaign Automation System

A full-stack application for managing and automating email campaigns with real-time tracking, analytics, and multiple provider support.

## Features

- 📧 Email Campaign Management
- 📊 Real-time Analytics
- 📈 Email Tracking (opens, deliveries)
- 📝 Template Management
- 📁 Multiple Data Source Support (CSV, Google Sheets)
- 🔄 Rate Limiting & Throttling
- 📅 Campaign Scheduling
- 🔌 Multiple Email Provider Support (SendGrid, Gmail, Outlook)

## Tech Stack

- Frontend: React, Material-UI
- Backend: Node.js, Express
- Database: MongoDB
- Queue: Redis, Bull
- Email Services: SendGrid, Gmail, Outlook
- Analytics: Real-time tracking
- Authentication: JWT

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis
- SendGrid Account
- Google Cloud Project (for Google Sheets integration)

## Environment Variables

Create a `.env` file in the backend directory:
## Server
PORT=5001
MONGODB_URI=your_mongodb_uri
REDIS_URL=your_redis_url
## JWT
JWT_SECRET=your_jwt_secret
## SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your_verified_sender_email
## Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/datasource/sheets/callback
## Optional Email Providers
GMAIL_USER=your_gmail
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
OUTLOOK_USER=your_outlook_email
OUTLOOK_PASSWORD=your_outlook_password


## Installation

1. Clone the repository:
git clone https://github.com/yourusername/email-automation-app.git
cd email-automation-app

2. Install backend dependencies:
bash
cd backend
npm install


3. Install frontend dependencies:
bash
cd ../frontend
npm install


## Google Sheets Integration Setup

1. Create a Google Cloud Project
2. Enable Google Sheets API and Google Drive API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5001/api/datasource/sheets/callback`
6. Configure test users if in testing mode

## SendGrid Setup

1. Create a SendGrid account
2. Create an API key with full access
3. Verify sender email
4. Configure Event Webhook:
   - Go to Settings → Mail Settings → Event Webhook
   - Set HTTP Post URL to your webhook endpoint
   - Enable events: Delivered, Opened
   - Ensure webhook status is "ON"

## Running the Application

1. Start MongoDB and Redis servers

2. Start the backend server:
bash
cd backend
npm start

3. Start the frontend development server:
bash
cd ../frontend
npm start

4. Start ngrok for webhook support:
bash
ngrok http 5001


5. Update SendGrid webhook URL with your ngrok URL:
   - Webhook URL format: `https://your-ngrok-url/api/email/webhook`

## Usage Guide

### Authentication
1. Register a new account
2. Login with credentials
3. JWT token will be stored automatically

### Data Source Setup
1. Navigate to Data Sources
2. Choose CSV upload or Google Sheets
3. For Google Sheets:
   - Click Connect
   - Authorize application
   - Select spreadsheet
   - Configure column mappings

### Email Campaign
1. Upload recipient data
2. Create email template
3. Configure sending options:
   - Select provider
   - Set throttle rate
   - Schedule if needed
4. Send campaign

### Monitoring
1. View real-time analytics
2. Track email status
3. Monitor delivery rates
4. Check response rates

## Troubleshooting

### Google Sheets Connection
- Verify OAuth credentials
- Check redirect URI configuration
- Ensure required APIs are enabled
- Add test users in development

### SendGrid Webhook
- Verify webhook URL is accessible
- Check event selection
- Monitor webhook logs
- Ensure ngrok is running

### Email Tracking
- Confirm SendGrid tracking is enabled
- Check webhook configuration
- Verify database updates
- Monitor server logs

## Security Considerations

1. API Security:
   - JWT authentication
   - Rate limiting
   - Input validation
   - Secure headers

2. Data Protection:
   - Encrypted passwords
   - Secure tokens
   - Protected routes
   - Data validation

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

This project is licensed under the MIT License

## Support

For support:
- Open an issue
- Email: support@example.com
- Documentation: [Wiki](link-to-wiki)
"# MailFlow-Pro" 
