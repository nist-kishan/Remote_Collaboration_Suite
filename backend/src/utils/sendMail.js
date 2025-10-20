import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

// Email configuration optimized for cloud deployments
const getEmailConfig = () => {
  return {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Enhanced configuration for cloud deployments
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    // TLS configuration for better compatibility
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  };
};

// Create transporter with configuration
const transporter = nodemailer.createTransport(getEmailConfig());

// Verify transporter configuration (non-blocking)
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️ SMTP Configuration Warning:', error.message);
    console.log('📧 Email service will be available with retry logic');
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

// Alternative verification with timeout
setTimeout(() => {
  transporter.verify((error, success) => {
    if (error) {
      console.warn('⚠️ SMTP Delayed Verification Warning:', error.message);
    } else {
      console.log('✅ SMTP Server verified successfully');
    }
  });
}, 5000); // Wait 5 seconds before verification

// Retry function for email sending
const retryEmailSend = async (mailOptions, maxRetries = 3, delay = 5000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Attempt ${attempt}/${maxRetries} - Sending email to: ${mailOptions.to}`);
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${mailOptions.to}. MessageId: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed for ${mailOptions.to}:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next retry (exponential backoff)
      delay *= 1.5;
    }
  }
};

export const sendEmail = async ({ email, subject, message, html }) => {
  try {
    const mailOptions = {
      from: `"Remote Work Collaboration Suite" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      text: message,
      html: html || `<p>${message}</p>`,
    };

    console.log(`📧 Subject: ${subject}`);
    
    // Use retry logic for sending email
    const result = await retryEmailSend(mailOptions);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to ${email} after all retries:`, error);
    throw error;
  }
};
