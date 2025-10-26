import dotenv from "dotenv";
dotenv.config();

export const otpTemplate = (name, otp) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <h2 style="color: #4CAF50;">Hello ${name},</h2>
    <p style="font-size: 16px;">Your OTP code is:</p>
    <h1 style="text-align: center; color: #333; background: #f5f5f5; padding: 10px; border-radius: 5px;">${otp}</h1>
    <p style="font-size: 14px; color: #666;">
      This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.
    </p>
    <p style="font-size: 14px; color: #666;">
      If you did not request this OTP, please ignore this email.
    </p>
    <hr style="margin: 20px 0;"/>
    <p style="font-size: 12px; color: #999; text-align: center;">
      &copy; ${new Date().getFullYear()} YourApp. All rights reserved.
    </p>
  </div>
`;

export const resetPasswordTemplate = (name, resetUrl) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <h2 style="color: #FF5733;">Hello ${name},</h2>
    <p style="font-size: 16px;">You requested to reset your password.</p>
    <p style="font-size: 14px;">Click the button below to reset your password:</p>
    <a href="${resetUrl}" 
       style="display:inline-block; padding: 10px 20px; background-color: #FF5733; color: #fff; text-decoration: none; border-radius: 5px;">
       Reset Password
    </a>
    <p style="font-size: 14px; color: #666;">
      This reset link is valid for <strong>15 minutes</strong>. If it expires, you'll need to request a new one.
    </p>
    <p style="font-size: 14px; color: #666;">
      If you did not request this, please ignore this email.
    </p>
    <hr style="margin: 20px 0;"/>
    <p style="font-size: 12px; color: #999; text-align: center;">
      &copy; ${new Date().getFullYear()} YourApp. All rights reserved.
    </p>
  </div>
`;

export const documentShareTemplate = (senderName, documentTitle, documentUrl, role, message = '') => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">📄 Document Shared</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Remote Work Collaboration Suite</p>
    </div>
    
    <!-- Main Content -->
    <div style="padding: 40px 30px; background-color: #f8f9fa;">
      <h2 style="color: #333; margin-bottom: 20px; font-size: 24px;">Hello!</h2>
      
      <p style="color: #555; line-height: 1.6; margin-bottom: 25px; font-size: 16px;">
        <strong style="color: #667eea;">${senderName}</strong> has shared a document with you:
      </p>
      
      <!-- Document Card -->
      <div style="background: white; padding: 25px; border-radius: 12px; border-left: 5px solid #667eea; margin: 25px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="color: #333; margin: 0 0 15px 0; font-size: 20px;">📋 ${documentTitle}</h3>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <span style="background: #e3f2fd; color: #1976d2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 10px;">
            ${role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
          <span style="color: #666; font-size: 14px;">
            Last modified: ${new Date().toLocaleDateString()}
          </span>
        </div>
      </div>
      
      <!-- Personal Message -->
      ${message ? `
        <div style="background: #e8f5e8; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #4caf50;">
          <p style="color: #2e7d32; margin: 0; font-style: italic; font-size: 16px;">
            💬 "${message}"
          </p>
        </div>
      ` : ''}
      
      <!-- Action Button -->
      <div style="text-align: center; margin: 35px 0;">
        <a href="${documentUrl}" 
           style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  color: white; 
                  padding: 15px 35px; 
                  text-decoration: none; 
                  border-radius: 30px; 
                  display: inline-block; 
                  font-weight: bold;
                  font-size: 16px;
                  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                  transition: all 0.3s ease;">
          🔗 View Document
        </a>
      </div>
      
      <!-- Instructions -->
      <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
        <p style="color: #856404; margin: 0; font-size: 14px;">
          <strong>📝 Note:</strong> If you don't have an account yet, you'll be prompted to create one to access the document. 
          Once you sign up, you'll automatically have access to this shared document.
        </p>
      </div>
      
      <!-- Role Information -->
      <div style="background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 25px 0;">
        <h4 style="color: #1976d2; margin: 0 0 10px 0; font-size: 16px;">🎯 Your Access Level:</h4>
        <p style="color: #1976d2; margin: 0; font-size: 14px;">
          ${role === 'editor' 
            ? '✏️ <strong>Editor:</strong> You can view, edit, and collaborate on this document.' 
            : '👁️ <strong>Viewer:</strong> You can view and read this document.'}
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f1f3f4; padding: 25px; text-align: center;">
      <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">
        This email was sent from <strong>Remote Work Collaboration Suite</strong>
      </p>
      <p style="color: #999; margin: 0; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Remote Work Collaboration Suite. All rights reserved.
      </p>
    </div>
  </div>
`;
