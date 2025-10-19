import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Configuration Error:', error);
  } else {
    console.log('✅ SMTP Server is ready to send emails');
  }
});

export const sendEmail = async ({ email, subject, message, html }) => {
  try {
    const mailOptions = {
      from: `"Remote Work Collaboration Suite" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      text: message,
      html: html || `<p>${message}</p>`,
    };

    console.log(`📧 Sending email to: ${email}`);
    console.log(`📧 Subject: ${subject}`);
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}. MessageId: ${result.messageId}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to send email to ${email}:`, error);
    throw error;
  }
};
