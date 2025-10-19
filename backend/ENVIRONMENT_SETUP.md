# Environment Setup Guide

## Required Environment Variables

To fix the `http://undefined` URL issue in email sharing, you need to set the following environment variables in your backend `.env` file:

### Frontend URL Configuration

```bash
# Primary environment variable for frontend URL
FRONTEND_URL=http://localhost:5173

# Alternative environment variable names (used as fallbacks)
CLIENT_URL=http://localhost:5173
NEXT_PUBLIC_FRONTEND_URL=http://localhost:5173
REACT_APP_FRONTEND_URL=http://localhost:5173
VITE_FRONTEND_URL=http://localhost:5173
```

### Production Configuration

For production deployment, update the URLs to your actual domain:

```bash
FRONTEND_URL=https://yourdomain.com
CLIENT_URL=https://yourdomain.com
```

### Development Configuration

For local development:

```bash
FRONTEND_URL=http://localhost:5173
```

### Complete .env Example

```bash
# Database
MONGODB_URI=mongodb://localhost:27017/remote_work_collaboration

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (IMPORTANT: Fixes the undefined URL issue)
FRONTEND_URL=http://localhost:5173

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## How the Fix Works

1. **URL Configuration Helper**: Created `backend/src/config/url.config.js` with robust URL generation
2. **Fallback System**: Multiple environment variable names are checked in order
3. **Default Fallback**: If no environment variable is set, defaults to `http://localhost:5173`
4. **Logging**: All URL generation is logged for debugging

## Testing the Fix

1. Set the `FRONTEND_URL` environment variable in your backend `.env` file
2. Restart your backend server
3. Share a document via email
4. Check the email - the URL should now be properly formed (e.g., `http://localhost:5173/documents/shared/68f4d11b9fe37907a9573cb4`)

## Troubleshooting

- **Still getting undefined URLs?**: Check that your `.env` file is in the backend directory and properly formatted
- **Wrong URL in emails?**: Verify the `FRONTEND_URL` environment variable matches your frontend server URL
- **Production issues?**: Make sure to set the correct production domain in your environment variables
