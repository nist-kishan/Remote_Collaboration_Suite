import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const getEmailConfig = () => {
  const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missingVars.join(', ')}`);
  }

  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: process.env.SMTP_PORT == 465 || process.env.SMTP_PORT == '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 8000,
    socketTimeout: 10000,
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    rateDelta: 20000,
    rateLimit: 5,
    tls: {
      rejectUnauthorized: false,
    },
    debug: false,
    logger: false
  };
};

let transporter = null;

const initializeTransporter = () => {
  try {
    const config = getEmailConfig();
    transporter = nodemailer.createTransport(config);
    return transporter;
  } catch (error) {
    throw error;
  }
};

initializeTransporter();

const retryEmailSend = async (mailOptions, maxRetries = 3, delay = 1000) => {
  if (!transporter) {
    initializeTransporter();
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await transporter.sendMail(mailOptions);
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5;
      
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.command === 'CONN') {
        try {
          if (transporter) {
            transporter.close();
          }
          initializeTransporter();
        } catch (initError) {
          console.error('Failed to reinitialize transporter:', initError.message);
        }
      }
    }
  }
};

export const sendEmail = async ({ email, subject, message, html }) => {
  try {
    if (!email || !subject || (!message && !html)) {
      throw new Error('Missing required email parameters: email, subject, and either message or html');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }

    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Remote Work Collaboration Suite'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject.trim(),
      text: message || '',
      html: html || `<p>${message || ''}</p>`,
      headers: {
        'X-Mailer': process.env.APP_NAME || 'Remote Work Collaboration Suite',
        'X-Priority': '3',
        'Reply-To': process.env.REPLY_TO_EMAIL || process.env.SMTP_USER,
      }
    };

    const result = await retryEmailSend(mailOptions);
    return result;
  } catch (error) {
    throw error;
  }
};
