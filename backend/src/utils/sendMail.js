import dotenv from "dotenv";
dotenv.config();

/**
 * Send email using Brevo API (formerly Sendinblue)
 * This is more reliable than SMTP and works better with cloud hosting providers like Render
 * 
 * @param {Object} mailOptions - Email options
 * @param {string} mailOptions.to - Recipient email address
 * @param {string} mailOptions.subject - Email subject
 * @param {string} mailOptions.html - HTML content (optional)
 * @param {string} mailOptions.text - Plain text content (optional)
 * @param {string} mailOptions.from - Sender email (optional, uses default from env)
 * @param {string} mailOptions.replyTo - Reply-to email (optional)
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @param {number} delay - Delay between retries in ms (default: 2000)
 * @returns {Promise<Object>} Response object with success status and message ID
 */
export const sendMail = async (mailOptions, maxRetries = 3, delay = 2000) => {
  // Validate required fields
  if (!mailOptions.to) {
    throw new Error("Recipient email address is required");
  }
  if (!mailOptions.subject) {
    throw new Error("Email subject is required");
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY not configured");
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Set sender
      const senderEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;
      const senderName = process.env.APP_NAME || 'Remote Collaboration Suite';
      
      // Prepare email payload
      const emailData = {
        sender: {
          name: senderName,
          email: senderEmail
        },
        to: [{ email: mailOptions.to }],
        subject: mailOptions.subject,
        headers: {
          "X-Mailer": senderName,
          "X-Priority": "3",
          ...(mailOptions.headers || {}),
        }
      };

      // Set content (prefer HTML over text)
      if (mailOptions.html) {
        emailData.htmlContent = mailOptions.html;
      }
      
      if (mailOptions.text) {
        emailData.textContent = mailOptions.text;
      }
      
      // Set reply-to if provided
      if (mailOptions.replyTo || process.env.REPLY_TO_EMAIL) {
        emailData.replyTo = {
          email: mailOptions.replyTo || process.env.REPLY_TO_EMAIL
        };
      }
      
      // Send email via Brevo API
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      return {
        success: true,
        messageId: result.messageId,
        response: result,
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

/**
 * Verify Brevo API connection
 * @returns {Promise<boolean>} True if connection is valid
 */
export const verifyBrevoConnection = async () => {
  try {
    if (!process.env.BREVO_API_KEY) {
      return false;
    }
    
    // Try to get account info as a way to verify API key
    const response = await fetch('https://api.brevo.com/v3/account', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      }
    });

    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Handle Brevo API errors
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
function handleMailError(error) {
  // Brevo API specific error codes
  if (error.message?.includes('401')) {
    return "Brevo API authentication failed. Check your BREVO_API_KEY configuration.";
  }
  if (error.message?.includes('400')) {
    return "Invalid email request. Check recipient address and email content.";
  }
  if (error.message?.includes('402')) {
    return "Brevo account quota exceeded. Upgrade your plan or wait for reset.";
  }
  if (error.message?.includes('403')) {
    return "Brevo API access forbidden. Check your API key permissions.";
  }
  if (error.message?.includes('429')) {
    return "Brevo rate limit exceeded. Wait before sending more emails.";
  }
  if (error.message?.includes('500')) {
    return "Brevo service temporarily unavailable. Please try again later.";
  }
  
  // Network errors
  if (error.code === "ETIMEDOUT") {
    return "Brevo email service is temporarily unavailable. Please try again later.";
  }
  if (error.code === "ECONNREFUSED") {
    return "Cannot connect to Brevo email service. Check your internet connection.";
  }
  if (error.code === "ENOTFOUND") {
    return "Brevo API server not found. Check your network connection.";
  }
  
  // Content errors
  if (error.message?.includes("Invalid email")) {
    return "Invalid email address format.";
  }
  if (error.message?.includes("unsubscribed")) {
    return "Recipient has unsubscribed from emails.";
  }
  if (error.message?.includes("blacklisted")) {
    return "Email address is blacklisted.";
  }
  
  // Generic fallback
  return `Brevo email delivery failed: ${error.message || 'Unknown error'}`;
}

// Export default for backward compatibility
export default sendMail;
