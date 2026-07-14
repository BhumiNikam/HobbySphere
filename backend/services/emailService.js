const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM
  ? `${process.env.EMAIL_FROM} <no-reply@hobbysphere.in>`
  : "HobbySphere <no-reply@hobbysphere.in>";

const FRONTEND_URL =
  process.env.FRONTEND_URL || "https://www.hobbysphere.in";

// Send welcome email
const sendWelcomeEmail = async (email, fullName) => {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "🎨 Welcome to HobbySphere!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎨 Welcome to HobbySphere!</h1>
            </div>
            <div class="content">
              <h2>Hi ${fullName}! 👋</h2>
              <p>Welcome to <strong>HobbySphere</strong> - where hobby enthusiasts connect and share their passions!</p>
              
              <p>Here's what you can do:</p>
              <ul>
                <li>✨ Share your hobby projects with posts and images</li>
                <li>❤️ Like and comment on posts from fellow enthusiasts</li>
                <li>👥 Follow users who share your interests</li>
                <li>🔔 Get real-time notifications for interactions</li>
                <li>🔍 Discover new hobbies through hashtags</li>
              </ul>
              
              <p>Ready to dive in? Start by creating your first post and connecting with the community!</p>
              
              <a href="${FRONTEND_URL}/feed" class="button">Go to Feed</a>
              
              <p style="margin-top: 30px;">Happy exploring! 🎉</p>
              <p><strong>The HobbySphere Team</strong></p>
            </div>
            <div class="footer">
              <p>You received this email because you signed up for HobbySphere.</p>
              <p>© 2026 HobbySphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Failed to send welcome email:", error);
    } else {
      console.log(`✅ Welcome email sent to ${email}`, data);
    }
  } catch (err) {
    console.error("❌ Failed to send welcome email:", err);
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, fullName, resetToken) => {
  const resetUrl = `${FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "🔐 Reset Your HobbySphere Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${fullName},</h2>
              <p>We received a request to reset your password for your HobbySphere account.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <a href="${resetUrl}" class="button">Reset Password</a>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul style="margin: 10px 0 0 0;">
                  <li>This link expires in <strong>1 hour</strong></li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Or copy and paste this link into your browser:<br>
                <span style="color: #667eea;">${resetUrl}</span>
              </p>
              
              <p style="margin-top: 30px;">Stay safe! 🛡️</p>
              <p><strong>The HobbySphere Team</strong></p>
            </div>
            <div class="footer">
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
              <p>© 2026 HobbySphere. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Failed to send password reset email:", error);
    } else {
      console.log(`✅ Password reset email sent to ${email}`, data);
    }
  } catch (err) {
    console.error("❌ Failed to send password reset email:", err);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
};