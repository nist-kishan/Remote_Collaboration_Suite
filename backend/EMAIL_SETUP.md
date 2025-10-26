# Email Configuration Guide - Brevo API

## Quick Setup

### 1. Get Brevo API Key
1. Go to https://www.brevo.com/ and sign up
2. Navigate to "SMTP & API" → "API Keys"
3. Click "Create an API key"
4. Copy the generated API key

### 2. Verify Your Email Address
1. Go to "Senders & IP" → "Senders"
2. Click "Add a sender"
3. Enter your email address (e.g., `yourname@gmail.com`)
4. Check your inbox and verify the email
5. This email will be used as `FROM_EMAIL`

### 3. Configure Environment Variables

Add these to your `.env` file:

```env
# Required: Your Brevo API key
BREVO_API_KEY=xkeysib-your-actual-api-key-here

# Required: Your verified sender email
FROM_EMAIL=asthakumariby2@outlook.com

# Optional: Reply-to email (can be same as FROM_EMAIL)
REPLY_TO_EMAIL=asthakumariby2@outlook.com

# Optional: Application name
APP_NAME=Remote Work Collaboration Suite
```

## Email Address Options

### Option 1: Use Personal Email (Easiest)
```env
FROM_EMAIL=asthakumariby2@outlook.com
REPLY_TO_EMAIL=asthakumariby2@outlook.com
```
✅ Works with any email provider (Gmail, Outlook, etc.)  
✅ No domain verification needed  
✅ Quick setup  
✅ Example: Outlook email already verified

### Option 2: Use Custom Domain
```env
FROM_EMAIL=hello@yourdomain.com
REPLY_TO_EMAIL=support@yourdomain.com
```
✅ More professional  
✅ Better deliverability  
⚠️ Requires domain verification in Brevo

## Important Notes

1. **FROM_EMAIL must be verified** in your Brevo account
2. **REPLY_TO_EMAIL** should be an email you check regularly
3. Both can be the same email address
4. You can use any email provider (Gmail, Outlook, Yahoo, etc.)
5. The email doesn't need to be your Brevo account email

## Testing

After configuration, restart your backend and check the console for:
```
✅ Brevo API connection verified successfully
✅ Email sent successfully via Brevo API
```

## Troubleshooting

### "Brevo API authentication failed"
- Check your `BREVO_API_KEY` is correct
- Make sure there are no extra spaces

### "Invalid sender email"
- Verify your email in Brevo → "Senders & IP" → "Senders"
- Make sure `FROM_EMAIL` matches a verified sender

### "Email not sending"
- Check your API key permissions
- Verify sender email is verified
- Check Brevo dashboard for error messages

## Free Tier Limits

- **300 emails per day** (free tier)
- **Unlimited** with paid plans
- No credit card required for free tier

## Advantages Over SMTP

✅ Works with cloud hosting (Render, Heroku, etc.)  
✅ No port blocking issues  
✅ Better reliability  
✅ Easier setup  
✅ Better error handling  
✅ No firewall configuration needed

