# Video Call Testing Guide

## 🎥 Video Call UI System Overview

The video call system now includes:

### **Components Created:**
1. **VideoCallInterface** - Full-screen video call interface
2. **CallNotification** - Navigation notification for active calls
3. **GlobalCallNotification** - Global call state management
4. **MinimizedCallInterface** - Draggable minimized call window

### **Features:**
- ✅ Full-screen video call interface
- ✅ Picture-in-picture local video
- ✅ Call controls (mute, video, screen share, end call)
- ✅ Participants panel
- ✅ Navigation notifications when away from call
- ✅ Minimized call interface
- ✅ Auto-hide controls
- ✅ Call status indicators
- ✅ Timer display
- ✅ Responsive design

## 🧪 Single Device Testing

### **Testing Steps:**

1. **Start the Application:**
   ```bash
   npm run dev
   ```

2. **Open Two Browser Windows:**
   - Window 1: `http://localhost:5173` (User A)
   - Window 2: `http://localhost:5173` (User B)

3. **Create Two Different User Accounts:**
   - Register User A with email: `user1@test.com`
   - Register User B with email: `user2@test.com`

4. **Start a Video Call:**
   - In User A's window, navigate to chat
   - Find User B in the user list
   - Click the video call button in the chat header
   - User B should receive an incoming call notification

5. **Test Call Flow:**
   - User B accepts the call
   - Both users should see the full-screen video interface
   - Test all controls: mute, video toggle, screen share, end call

6. **Test Navigation Notifications:**
   - While in a call, navigate away from `/call/` route
   - Should see a notification box in the top-right corner
   - Click "Join Call" to return to the call interface

### **Expected Behavior:**

#### **Caller (User A):**
- ✅ Outgoing call modal appears
- ✅ Transitions to full-screen video interface
- ✅ Can see own video in picture-in-picture
- ✅ All controls work properly

#### **Receiver (User B):**
- ✅ Incoming call modal appears
- ✅ Can accept or reject the call
- ✅ Transitions to full-screen video interface
- ✅ Can see caller's video

#### **Navigation Notifications:**
- ✅ Notification appears when navigating away from active call
- ✅ Shows call status, participant info, and controls
- ✅ "Join Call" button returns to video interface
- ✅ "End Call" button terminates the call

## 🚀 Deployment Preparation

### **Environment Variables:**
Make sure these are set in your production environment:

```env
# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret

# Email Service (Choose one)
EMAIL_SERVICE=brevo
BREVO_API_KEY=your_brevo_api_key
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=your_brevo_email
BREVO_SMTP_PASS=your_brevo_password

# Or use SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_api_key

# Or use Mailgun
EMAIL_SERVICE=mailgun
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Frontend
VITE_API_URL=https://your-backend-url.com/api/v1
VITE_SOCKET_URL=https://your-backend-url.com
```

### **Production Build:**
```bash
# Backend
cd backend
npm install --production
npm run build

# Frontend
cd frontend
npm install --production
npm run build
```

### **Deployment Checklist:**
- [ ] Environment variables configured
- [ ] Database connection established
- [ ] Email service configured and tested
- [ ] File upload service (Cloudinary) configured
- [ ] WebSocket connections working
- [ ] HTTPS enabled for WebRTC
- [ ] CORS configured for production domains
- [ ] Rate limiting configured
- [ ] Error handling and logging set up

## 🔧 Troubleshooting

### **Common Issues:**

1. **"Camera or microphone is being used by another application"**
   - Close other applications using camera/microphone
   - Refresh the browser page
   - Check browser permissions

2. **WebRTC connection fails**
   - Ensure HTTPS is enabled (required for WebRTC)
   - Check firewall settings
   - Verify STUN/TURN server configuration

3. **Video not showing**
   - Check camera permissions
   - Ensure camera is not being used by another application
   - Try refreshing the page

4. **Audio not working**
   - Check microphone permissions
   - Ensure audio is not muted in browser
   - Check system audio settings

### **Browser Compatibility:**
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 📱 Mobile Testing

For mobile testing:
1. Use responsive design mode in browser dev tools
2. Test touch controls
3. Verify camera/microphone permissions on mobile
4. Test landscape/portrait orientation changes

## 🎯 Performance Optimization

### **Video Quality Settings:**
- Default: 720p (1280x720)
- Fallback: 480p (640x480)
- Low bandwidth: 360p (480x360)

### **Audio Settings:**
- Sample rate: 48kHz
- Bitrate: 128kbps
- Echo cancellation: Enabled
- Noise suppression: Enabled

## 📊 Monitoring

Monitor these metrics in production:
- Call success rate
- Average call duration
- Video quality metrics
- Audio quality metrics
- Connection failures
- User engagement

---

## 🚀 Ready for Deployment!

Your video call system is now ready for deployment with:
- ✅ Comprehensive UI components
- ✅ Navigation notifications
- ✅ Single device testing capability
- ✅ Production-ready configuration
- ✅ Error handling and fallbacks
- ✅ Responsive design
- ✅ Performance optimizations

**Next Steps:**
1. Test thoroughly on single device
2. Deploy to staging environment
3. Test with multiple users
4. Deploy to production
5. Monitor and optimize

Happy calling! 🎥✨
