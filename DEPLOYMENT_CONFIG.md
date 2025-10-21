# 🚀 Deployment Configuration Guide

## 📋 Pre-Deployment Checklist

### **Backend Requirements:**
- [ ] Node.js 18+ installed
- [ ] MongoDB database configured
- [ ] Email service configured (Brevo/SendGrid/Mailgun)
- [ ] Cloudinary account for file uploads
- [ ] Environment variables set
- [ ] HTTPS certificate configured
- [ ] CORS configured for production domains

### **Frontend Requirements:**
- [ ] Production build created
- [ ] Environment variables configured
- [ ] Static files optimized
- [ ] CDN configured (optional)
- [ ] Error monitoring set up

## 🔧 Environment Variables

### **Backend (.env)**
```env
# Server Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# JWT Secrets
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Choose one)
EMAIL_SERVICE=brevo
BREVO_API_KEY=your-brevo-api-key
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your-brevo-email@domain.com
BREVO_SMTP_PASS=your-brevo-password

# Or SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key

# Or Mailgun
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain

# Cloudinary (File Uploads)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Password Reset
RESET_PASSWORD_TOKEN_EXPIRY=3600000

# CORS
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebRTC
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
```

### **Frontend (.env.production)**
```env
VITE_API_URL=https://your-backend-domain.com/api/v1
VITE_SOCKET_URL=https://your-backend-domain.com
VITE_APP_NAME=Remote Work Collaboration Suite
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production
```

## 🏗️ Build Commands

### **Backend Build:**
```bash
cd backend
npm ci --production
npm run build
```

### **Frontend Build:**
```bash
cd frontend
npm ci --production
npm run build
```

## 🌐 Deployment Platforms

### **Option 1: Render.com (Recommended)**
```yaml
# render.yaml
services:
  - type: web
    name: remote-work-backend
    env: node
    buildCommand: cd backend && npm ci --production
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        fromDatabase:
          name: remote-work-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: BREVO_API_KEY
        sync: false
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false

  - type: web
    name: remote-work-frontend
    env: static
    buildCommand: cd frontend && npm ci --production && npm run build
    staticPublishPath: frontend/dist
    envVars:
      - key: VITE_API_URL
        value: https://remote-work-backend.onrender.com/api/v1
      - key: VITE_SOCKET_URL
        value: https://remote-work-backend.onrender.com

databases:
  - name: remote-work-db
    databaseName: remotework
    user: remoteworkuser
```

### **Option 2: Vercel + Railway**
```json
// vercel.json (Frontend)
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://your-railway-backend.railway.app/api/v1",
    "VITE_SOCKET_URL": "https://your-railway-backend.railway.app"
  }
}
```

### **Option 3: Netlify + Heroku**
```toml
# netlify.toml (Frontend)
[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_API_URL = "https://your-heroku-backend.herokuapp.com/api/v1"
  VITE_SOCKET_URL = "https://your-heroku-backend.herokuapp.com"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔒 Security Configuration

### **HTTPS Setup:**
```javascript
// backend/src/server.js
const https = require('https');
const fs = require('fs');

if (process.env.NODE_ENV === 'production') {
  const options = {
    key: fs.readFileSync('path/to/private-key.pem'),
    cert: fs.readFileSync('path/to/certificate.pem')
  };
  
  https.createServer(options, app).listen(port, () => {
    console.log(`HTTPS Server running on port ${port}`);
  });
}
```

### **CORS Configuration:**
```javascript
// backend/src/app.js
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with']
};

app.use(cors(corsOptions));
```

## 📊 Monitoring & Logging

### **Error Monitoring (Sentry):**
```javascript
// backend/src/app.js
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.requestHandler());
app.use(Sentry.errorHandler());
```

### **Health Check Endpoint:**
```javascript
// backend/src/app.js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});
```

## 🚀 Deployment Steps

### **1. Prepare Backend:**
```bash
cd backend
npm ci --production
npm run build
```

### **2. Prepare Frontend:**
```bash
cd frontend
npm ci --production
npm run build
```

### **3. Deploy Backend:**
- Upload backend files to server
- Set environment variables
- Install dependencies
- Start the server

### **4. Deploy Frontend:**
- Upload frontend/dist folder
- Configure web server (nginx/apache)
- Set up SSL certificate
- Configure routing

### **5. Test Deployment:**
- Test API endpoints
- Test WebSocket connections
- Test video call functionality
- Test file uploads
- Test email sending

## 🔍 Post-Deployment Testing

### **API Testing:**
```bash
# Test health endpoint
curl https://your-backend-domain.com/health

# Test authentication
curl -X POST https://your-backend-domain.com/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### **Video Call Testing:**
1. Open two different browsers
2. Create two user accounts
3. Start a video call
4. Test all call features
5. Test navigation notifications

## 📈 Performance Optimization

### **Backend Optimization:**
- Enable gzip compression
- Set up Redis for session storage
- Configure database indexing
- Set up CDN for static assets

### **Frontend Optimization:**
- Enable gzip compression
- Set up browser caching
- Optimize images
- Minify CSS/JS files

## 🆘 Troubleshooting

### **Common Issues:**
1. **CORS Errors:** Check ALLOWED_ORIGINS configuration
2. **WebSocket Issues:** Ensure HTTPS is enabled
3. **File Upload Failures:** Check Cloudinary configuration
4. **Email Not Sending:** Verify email service credentials
5. **Database Connection:** Check MongoDB URI and network access

### **Logs to Monitor:**
- Application logs
- Error logs
- Access logs
- Database logs
- WebSocket connection logs

---

## ✅ Ready for Production!

Your application is now ready for deployment with:
- ✅ Comprehensive video call UI system
- ✅ Navigation notifications
- ✅ Production-ready configuration
- ✅ Security measures
- ✅ Monitoring setup
- ✅ Performance optimizations

**Deploy with confidence!** 🚀
