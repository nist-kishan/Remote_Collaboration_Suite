import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

// Alternative email service configurations for better cloud deployment support
const getEmailConfig = () => {
  const configs = [
    // Primary configuration
    {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 60000,
      greetingTimeout: 30000,
      socketTimeout: 60000,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      rateDelta: 20000,
      rateLimit: 5,
      retryDelay: 5000,
      retryAttempts: 3,
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      debug: process.env.NODE_ENV === 'development',
      logger: process.env.NODE_ENV === 'development'
    },
    // Fallback configuration for cloud deployments
    {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 30000, // Shorter timeout
      greetingTimeout: 15000,
      socketTimeout: 30000,
      pool: false, // Disable pooling for cloud
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3'
      },
      debug: false,
      logger: false
    }
  ];
  
  return configs;
};

// Create transporter with primary configuration
const configs = getEmailConfig();
const transporter = nodemailer.createTransport(configs[0]);

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

// Retry function for email sending with fallback configurations
const retryEmailSend = async (mailOptions, maxRetries = 3, delay = 5000) => {
  const configs = getEmailConfig();
  
  for (let configIndex = 0; configIndex < configs.length; configIndex++) {
    const currentConfig = configs[configIndex];
    const currentTransporter = nodemailer.createTransport(currentConfig);
    
    console.log(`📧 Trying configuration ${configIndex + 1}/${configs.length}`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 Attempt ${attempt}/${maxRetries} - Sending email to: ${mailOptions.to}`);
        const result = await currentTransporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${mailOptions.to}. MessageId: ${result.messageId}`);
        return result;
      } catch (error) {
        console.error(`❌ Attempt ${attempt}/${maxRetries} failed for ${mailOptions.to}:`, error.message);
        
        if (attempt === maxRetries) {
          // If this is the last config, throw the error
          if (configIndex === configs.length - 1) {
            throw error;
          }
          // Otherwise, break to try next configuration
          break;
        }
        
        // Wait before retrying
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increase delay for next retry (exponential backoff)
        delay *= 1.5;
      }
    }
    
    // Close the current transporter
    currentTransporter.close();
  }
  
  throw new Error('All email configurations failed');
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
