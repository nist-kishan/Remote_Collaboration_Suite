import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

// Email configuration optimized for cloud deployments
const getEmailConfig = () => {
  // Validate required environment variables
  const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required SMTP environment variables:', missingVars);
    throw new Error(`Missing SMTP configuration: ${missingVars.join(', ')}`);
  }

  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT == 465 || process.env.SMTP_PORT == '465',
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

  console.log('📧 SMTP Configuration:', {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.auth.user,
    // Don't log password for security
    hasPassword: !!config.auth.pass
  });

  return config;
};

// Create transporter with configuration
let transporter = null;

const initializeTransporter = () => {
  try {
    const config = getEmailConfig();
    transporter = nodemailer.createTransport(config);
    
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
      if (transporter) {
        transporter.verify((error, success) => {
          if (error) {
            console.warn('⚠️ SMTP Delayed Verification Warning:', error.message);
          } else {
            console.log('✅ SMTP Server verified successfully');
          }
        });
      }
    }, 5000); // Wait 5 seconds before verification

    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize SMTP transporter:', error.message);
    throw error;
  }
};

// Initialize transporter
initializeTransporter();

// Retry function for email sending with improved error handling
const retryEmailSend = async (mailOptions, maxRetries = 3, delay = 5000) => {
  // Ensure transporter is initialized
  if (!transporter) {
    console.log('🔄 Reinitializing transporter...');
    initializeTransporter();
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📧 Attempt ${attempt}/${maxRetries} - Sending email to: ${mailOptions.to}`);
      console.log(`📧 Subject: ${mailOptions.subject}`);
      
      const result = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent successfully to ${mailOptions.to}. MessageId: ${result.messageId}`);
      return result;
    } catch (error) {
      console.error(`❌ Attempt ${attempt}/${maxRetries} failed for ${mailOptions.to}:`, {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response
      });
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Increase delay for next retry (exponential backoff)
      delay *= 1.5;
      
      // Try to reinitialize transporter on certain errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.log('🔄 Attempting to reinitialize transporter due to connection error...');
        try {
          initializeTransporter();
        } catch (initError) {
          console.error('❌ Failed to reinitialize transporter:', initError.message);
        }
      }
    }
  }
};

export const sendEmail = async ({ email, subject, message, html }) => {
  try {
    // Validate input parameters
    if (!email || !subject || (!message && !html)) {
      throw new Error('Missing required email parameters: email, subject, and either message or html');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }

    const mailOptions = {
      from: `"Remote Work Collaboration Suite" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject.trim(),
      text: message || '',
      html: html || `<p>${message || ''}</p>`,
      // Add headers for better deliverability
      headers: {
        'X-Mailer': 'Remote Work Collaboration Suite',
        'X-Priority': '3',
      }
    };

    console.log(`📧 Preparing to send email to: ${email}`);
    console.log(`📧 Subject: ${subject}`);
    
    // Use retry logic for sending email
    const result = await retryEmailSend(mailOptions);
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to ${email} after all retries:`, {
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    throw error;
  }
};

// Test email function for debugging
export const testEmailConnection = async () => {
  try {
    if (!transporter) {
      initializeTransporter();
    }
    
    const result = await transporter.verify();
    console.log('✅ Gmail SMTP connection test successful');
    console.log('📧 Ready to send emails via Gmail');
    return { success: true, message: 'Gmail SMTP connection is working' };
  } catch (error) {
    console.error('❌ Gmail SMTP connection test failed:', error.message);
    
    // Gmail-specific error messages
    if (error.message.includes('Invalid login')) {
      return { 
        success: false, 
        message: 'Gmail authentication failed. Check your email and app password.' 
      };
    } else if (error.message.includes('Less secure app')) {
      return { 
        success: false, 
        message: 'Enable 2-Factor Authentication and use App Password instead of regular password.' 
      };
    } else if (error.message.includes('Connection timeout')) {
      return { 
        success: false, 
        message: 'Gmail connection timeout. Check your internet connection.' 
      };
    }
    
    return { success: false, message: error.message };
  }
};

// Get email configuration status
export const getEmailStatus = () => {
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  return {
    configured: missingVars.length === 0,
    missingVars,
    hasTransporter: !!transporter,
    environment: process.env.NODE_ENV
  };
};