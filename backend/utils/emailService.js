require("dotenv").config();
const nodemailer = require("nodemailer");

// Create email transporter
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      // <-- FIXED: Removed the "er"
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Default SMTP configuration
  return nodemailer.createTransport({
    // <-- FIXED: Removed the "er"
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};
/**
 * Send OTP email to user
 */
exports.sendOTPEmail = async (email, otp, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"ChatBot Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your ChatBot Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px solid #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
            .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #667eea; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Two-Factor Authentication</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>You requested a verification code to access your ChatBot account. Use the code below to complete your login:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #666;">Valid for 10 minutes</p>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> Never share this code with anyone. ChatBot staff will never ask for your verification code.
              </div>
              
              <p>If you didn't request this code, please ignore this email and ensure your account is secure.</p>
              
              <p>Best regards,<br>ChatBot Security Team</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} ChatBot. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("OTP Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send verification email");
  }
};

/**
 * Send 2FA enabled notification
 */
exports.send2FAEnabledAlert = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"ChatBot Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔒 Two-Factor Authentication Enabled",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .alert-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Security Update</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <div class="alert-box">
                <strong>Two-Factor Authentication has been enabled on your account.</strong>
              </div>
              
              <p>Your account is now protected with an additional layer of security. You'll need to enter a verification code sent to your email each time you log in.</p>
              
              <p><strong>Details:</strong></p>
              <ul>
                <li>Method: Email OTP</li>
                <li>Enabled: ${new Date().toLocaleString()}</li>
              </ul>
              
              <p>If you didn't enable 2FA, please secure your account immediately by changing your password.</p>
              
              <p>Best regards,<br>ChatBot Security Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending 2FA alert:", error);
  }
};

/**
 * Send 2FA disabled notification
 */
exports.send2FADisabledAlert = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"ChatBot Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "⚠️ Two-Factor Authentication Disabled",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .warning-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Security Alert</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              
              <div class="warning-box">
                <strong>Two-Factor Authentication has been disabled on your account.</strong>
              </div>
              
              <p>Your account security level has been reduced. We recommend keeping 2FA enabled for maximum protection.</p>
              
              <p><strong>Details:</strong></p>
              <ul>
                <li>Action: 2FA Disabled</li>
                <li>Time: ${new Date().toLocaleString()}</li>
              </ul>
              
              <p>If you didn't disable 2FA, your account may be compromised. Please:</p>
              <ol>
                <li>Change your password immediately</li>
                <li>Re-enable Two-Factor Authentication</li>
                <li>Review your account activity</li>
              </ol>
              
              <p>Best regards,<br>ChatBot Security Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending 2FA disabled alert:", error);
  }
};

/**
 * Send backup codes email
 */
exports.sendBackupCodesEmail = async (email, userName, backupCodes) => {
  try {
    const transporter = createTransporter();

    const codesHTML = backupCodes
      .map(
        (code) =>
          `<li><code style="background: #f4f4f4; padding: 5px 10px; border-radius: 4px; font-size: 16px;">${code}</code></li>`,
      )
      .join("");

    const mailOptions = {
      from: `"ChatBot Security" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🔑 Your ChatBot Backup Codes",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .codes-box { background: white; border: 2px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 10px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            code { font-family: 'Courier New', monospace; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔑 Backup Recovery Codes</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${userName}</strong>,</p>
              <p>Here are your backup codes for Two-Factor Authentication. Each code can be used <strong>once</strong> to access your account if you lose access to your email.</p>
              
              <div class="codes-box">
                <h3>Your Backup Codes:</h3>
                <ul style="list-style: none; padding: 0;">
                  ${codesHTML}
                </ul>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>Save these codes in a secure location</li>
                  <li>Each code can only be used once</li>
                  <li>Do not share these codes with anyone</li>
                  <li>Generate new codes if you lose these</li>
                </ul>
              </div>
              
              <p>Best regards,<br>ChatBot Security Team</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending backup codes email:", error);
  }
};

/**
 * Send Welcome Email on Registration
 */
exports.sendWelcomeEmail = async (email, userName) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Verity ChatBot" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Verity ChatBot! 🎉",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="background-color: #f4f7f6; margin: 0; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            
            <tr>
              <td style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 1px;">Verity ChatBot</h1>
              </td> 
            </tr>

            <tr>
              <td style="padding: 40px 30px;">
                <h2 style="color: #333333; margin-top: 0;">Welcome aboard, ${userName}! 👋</h2>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                  We are absolutely thrilled to have you join us. Your account has been successfully created and you are currently set up on our <strong>Free Plan</strong>.
                </p>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.6;">
                  Verity ChatBot is designed to make content management seamless and intuitive. Whenever you are ready to unlock premium features, you can easily upgrade your account directly from your dashboard.
                </p>

                <div style="text-align: center; margin: 35px 0;">
                  <a href="http://localhost:3000/login" style="background-color: #4F46E5; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                    Log In to Your Dashboard
                  </a>
                </div>
                
                <p style="color: #555555; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
                  Best regards,<br>
                  <strong>The Verity ChatBot Team</strong>
                </p>
              </td>
            </tr>

            <tr>
              <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                <p style="color: #888888; font-size: 12px; margin: 0; line-height: 1.5;">
                  &copy; ${new Date().getFullYear()} Verity ChatBot. All rights reserved.<br>
                  Ahmedabad, Gujarat, India<br>
                  <br>
                  <em>You are receiving this email because you recently created an account with us.</em>
                </p>
              </td>
            </tr>

          </table>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `Welcome email successfully sent to: ${email} [Message ID: ${info.messageId}]`,
    );
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
};
