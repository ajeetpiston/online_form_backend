const nodemailer = require("nodemailer");
const logger = require("./logger");

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Email templates
const emailTemplates = {
  emailVerification: (data) => ({
    subject: "Verify Your Email - Online Forms",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Online Forms, ${data.name}!</h2>
        <p>Thank you for registering with us. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.verificationUrl}" 
             style="background-color: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
        <p>This verification link will expire in 24 hours.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          If you didn't create an account with us, please ignore this email.
        </p>
      </div>
    `,
  }),

  passwordReset: (data) => ({
    subject: "Password Reset - Online Forms",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hello ${data.name},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.resetUrl}" 
             style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p><a href="${data.resetUrl}">${data.resetUrl}</a></p>
        <p>This reset link will expire in 10 minutes for security reasons.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 14px;">
          If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `,
  }),

  applicationSubmitted: (data) => ({
    subject: `Application Submitted - ${data.applicationTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Submitted Successfully</h2>
        <p>Hello ${data.userName},</p>
        <p>Your application for <strong>${data.applicationTitle}</strong> has been submitted successfully.</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3>Application Details:</h3>
          <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
          <p><strong>Submission Type:</strong> ${data.submissionType}</p>
          <p><strong>Status:</strong> ${data.status}</p>
          <p><strong>Submitted At:</strong> ${data.submittedAt}</p>
        </div>
        <p>You can track your application status using the tracking number provided above.</p>
        <p>We will notify you of any updates regarding your application.</p>
      </div>
    `,
  }),

  applicationStatusUpdate: (data) => ({
    subject: `Application Status Update - ${data.applicationTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Application Status Update</h2>
        <p>Hello ${data.userName},</p>
        <p>The status of your application for <strong>${
          data.applicationTitle
        }</strong> has been updated.</p>
        <div style="background-color: #F3F4F6; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
          <p><strong>New Status:</strong> <span style="color: ${
            data.statusColor
          };">${data.status}</span></p>
          ${
            data.adminNotes
              ? `<p><strong>Notes:</strong> ${data.adminNotes}</p>`
              : ""
          }
        </div>
        <p>Thank you for using our service.</p>
      </div>
    `,
  }),
};

// Send email function
exports.sendEmail = async ({ to, subject, template, data }) => {
  try {
    const transporter = createTransporter();

    let emailContent;
    if (template && emailTemplates[template]) {
      emailContent = emailTemplates[template](data);
    } else {
      emailContent = { subject, html: data.html || data.text };
    }

    const mailOptions = {
      from: `"Online Forms" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    };

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}`, {
      messageId: result.messageId,
    });

    return result;
  } catch (error) {
    logger.error("Failed to send email:", error);
    throw error;
  }
};
