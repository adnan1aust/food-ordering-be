import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: 465,
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

const sendMagicLink = async (
  email: string,
  magicLink: string,
  userName?: string,
): Promise<boolean> => {
  const subject = "Your Magic Link - Food Ordering App";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f4f4f4; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { font-size: 12px; color: #666; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Food Ordering App</h2>
        </div>
        <div class="content">
          <p>Hello ${userName || "User"},</p>
          <p>You requested a magic link to sign in to your account. Click the link below to continue:</p>
          <p>Copy and paste this link into your browser:</p>
          <p><a href="${magicLink}">${magicLink}</a></p>
          
          <p><strong>Important:</strong> This link will expire in 15 minutes for security reasons.</p>
          
          <p>If you didn't request this link, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Hello ${userName || "User"},

    You requested a magic link to sign in to your account.
    
    Click this link to continue: ${magicLink}
    
    Important: This link will expire in 15 minutes for security reasons.
    
    If you didn't request this link, please ignore this email.
  `;

  return await sendEmail({
    to: email,
    subject,
    text: textContent,
    html: htmlContent,
  });
};

export { sendEmail, sendMagicLink };
export default sendEmail;
