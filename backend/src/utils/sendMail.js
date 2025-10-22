import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

// Brevo-optimized transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Brevo-specific optimizations
  pool: true,
  maxConnections: parseInt(process.env.SMTP_MAX_CONNECTIONS) || 5,
  maxMessages: parseInt(process.env.SMTP_MAX_MESSAGES) || 100,
  rateLimit: parseInt(process.env.RATE_LIMIT_EMAILS || "20"), // Brevo allows higher rates
  rateDelta: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"), // 1 minute window
  // TLS configuration optimized for Brevo
  tls: {
    rejectUnauthorized: false,
  },
  // Connection timeout settings
  connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT) || 60000, // 60 seconds
  greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT) || 30000,    // 30 seconds
  socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT) || 60000,      // 60 seconds
  // Brevo-specific settings
  requireTLS: true,
});

// Verify Brevo connection
export const verifyBrevoConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    return false;
  }
};

export const sendMail = async (mailOptions, maxRetries = 3, delay = 2000) => {
  // Validate required fields
  if (!mailOptions.to) {
    throw new Error("Recipient email address is required");
  }
  if (!mailOptions.subject) {
    throw new Error("Email subject is required");
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Use verified email as sender for better delivery
      const verifiedSender = process.env.REPLY_TO_EMAIL || process.env.SMTP_USER;
      
      // Brevo-optimized email options
      const brevoMailOptions = {
        from: `"${process.env.APP_NAME || 'Remote Collaboration Suite'}" <${verifiedSender}>`,
        to: mailOptions.to,
        subject: mailOptions.subject,
        text: mailOptions.text || mailOptions.message || '',
        html: mailOptions.html || '',
        // Brevo-specific headers
        headers: {
          "X-Mailer": process.env.APP_NAME || "Remote Collaboration Suite",
          "X-Priority": "3",
          "X-Brevo-SMTP": "true",
          "Reply-To": verifiedSender,
          "Return-Path": verifiedSender,
          ...(mailOptions.headers || {}),
        },
        // Brevo-specific message options
        messageId: `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@brevo.com>`,
        date: new Date(),
        ...mailOptions,
      };

      const info = await transporter.sendMail(brevoMailOptions);

      return {
        success: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error) {

      if (attempt < maxRetries) {
        const backoffDelay = delay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise((r) => setTimeout(r, backoffDelay));
      } else {
        throw new Error(handleMailError(error));
      }
    }
  }
};

function handleMailError(error) {
  // Brevo-specific error handling
  if (error.code === "ETIMEDOUT") return "Brevo email service is temporarily unavailable. Please try again later.";
  if (error.code === "ECONNREFUSED") return "Cannot connect to Brevo email service. Check your internet connection.";
  if (error.code === "ENOTFOUND") return "Brevo SMTP server not found. Check your SMTP_HOST configuration.";
  if (error.code === "EAUTH") return "Brevo authentication failed. Check your SMTP credentials.";
  if (error.code === "EENVELOPE") return "Invalid email address format.";
  if (error.code === "EMESSAGE") return "Invalid email message format.";
  
  // Response code errors
  if (error.responseCode === 535) return "Brevo authentication failed. Check your SMTP credentials.";
  if (error.responseCode === 550) return "Brevo rejected the email. Check recipient address and sender reputation.";
  if (error.responseCode === 552) return "Brevo mailbox full or message too large.";
  if (error.responseCode === 553) return "Brevo rejected: invalid sender or recipient address.";
  if (error.responseCode === 421) return "Brevo service temporarily unavailable. Try again later.";
  if (error.responseCode === 450) return "Brevo mailbox temporarily unavailable.";
  if (error.responseCode === 451) return "Brevo local error in processing.";
  if (error.responseCode === 452) return "Brevo insufficient system storage.";
  
  // Message-specific errors
  if (error.message.includes("Invalid login")) return "Brevo login failed. Check your SMTP credentials.";
  if (error.message.includes("Authentication failed")) return "Brevo authentication failed. Verify your SMTP credentials.";
  if (error.message.includes("Connection timeout")) return "Brevo connection timeout. Check your network connection.";
  if (error.message.includes("Rate limit")) return "Brevo rate limit exceeded. Wait before sending more emails.";
  if (error.message.includes("Spam")) return "Brevo flagged email as spam. Check content and sender reputation.";
  if (error.message.includes("quota")) return "Brevo sending quota exceeded. Upgrade your plan or wait for reset.";
  
  // Generic fallback
  return `Brevo email delivery failed: ${error.message}`;
}
