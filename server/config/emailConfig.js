// config/emailConfig.js
const nodemailer = require('nodemailer');

// 邮件配置选项
const emailConfig = {
  // Gmail配置
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
  
  // SendGrid配置 (备选)
  sendgrid: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  },
  
  // Outlook配置 (备选)
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },

  // 自定义SMTP配置
  custom: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  },
};

// 检查是否为真实邮件配置
const isRealEmailConfig = () => {
  return process.env.EMAIL_USER && 
         process.env.EMAIL_PASS && 
         !process.env.EMAIL_USER.includes('ethereal.email') &&
         process.env.EMAIL_HOST !== 'smtp.ethereal.email';
};

// 验证邮件配置
const validateEmailConfig = (config) => {
  if (!config.host) throw new Error('邮件服务器地址(host)未配置');
  if (!config.port) throw new Error('邮件服务器端口(port)未配置');
  if (!config.auth || !config.auth.user || !config.auth.pass) {
    throw new Error('邮件认证信息(user/pass)未配置');
  }
  return true;
};

// 创建传输器
const createTransporter = async () => {
  try {
    // 检查是否配置了真实邮件服务
    if (isRealEmailConfig()) {
      const provider = process.env.EMAIL_PROVIDER || 'gmail';
      
      // 如果指定了自定义HOST，使用custom配置
      if (process.env.EMAIL_HOST && provider !== 'sendgrid') {
        const config = emailConfig.custom;
        validateEmailConfig(config);
                 console.log(`📧 Using custom SMTP service: ${config.host}:${config.port}`);
         return nodemailer.createTransport(config);
      }
      
      // 使用预定义的邮件服务提供商
      const config = emailConfig[provider];
      if (!config) {
        throw new Error(`不支持的邮件提供商: ${provider}`);
      }
      
             validateEmailConfig(config);
       console.log(`📧 Using ${provider} email service`);
       return nodemailer.createTransport(config);
    }
    
    // 使用测试账号（包括.env中配置的ethereal账号或自动生成）
    console.log("⚠️  Using test email account - emails won't be delivered to real addresses");
    
         // 如果.env中配置了ethereal账号，直接使用
     if (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('ethereal.email')) {
       console.log("📧 Using configured ethereal account:", process.env.EMAIL_USER);
       return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
    
         // 否则自动生成测试账号
     const testAccount = await nodemailer.createTestAccount();
     console.log("📧 Using auto-generated ethereal account:", testAccount.user);
     return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
  } catch (error) {
    console.error('❌ 邮件传输器创建失败:', error.message);
    throw error;
  }
};

// 邮件模板
const emailTemplates = {
  registration: (name, link) => ({
    subject: "Employee Registration Invitation - Action Required",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Employee Registration</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1976d2, #42a5f5); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Our Team!</h1>
          <p style="color: #e3f2fd; margin: 10px 0 0 0; font-size: 16px;">Employee Management System</p>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
          <h2 style="color: #1976d2; margin-top: 0;">Registration Invitation</h2>
          
          <p>Hello <strong>${name || 'New Employee'}</strong>,</p>
          
          <p>You have been invited to join our Employee Management System. Please complete your registration by clicking the link below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" 
               style="background: #1976d2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;">
              Complete Registration
            </a>
          </div>
          
          <p style="font-size: 14px; color: #666;">
            <strong>Important:</strong> This registration link will expire in <strong>3 hours</strong>. Please complete your registration promptly.
          </p>
          
          <p style="font-size: 14px; color: #666;">
            If you cannot click the button above, copy and paste this link into your browser:<br>
            <a href="${link}" style="color: #1976d2; word-break: break-all;">${link}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This email was sent by the Employee Management System HR Team.<br>
            If you have any questions, please contact your HR representative.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Hello ${name || 'New Employee'},
      
      You have been invited to join our Employee Management System.
      Please complete your registration by visiting this link: ${link}
      
      Important: This registration link will expire in 3 hours.
      
      If you have any questions, please contact your HR representative.
      
      Best regards,
      Employee Management System HR Team
    `
  }),
};

// 发送邮件的通用函数
const sendEmail = async (mailOptions) => {
  try {
    const transporter = await createTransporter();
    
    // 设置默认发件人信息
    const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER || 'noreply@example.com';
    const fromName = process.env.EMAIL_FROM_NAME || "Employee Management System";
    
    const finalMailOptions = {
      from: `"${fromName}" <${fromAddress}>`,
      ...mailOptions
    };
    
    const info = await transporter.sendMail(finalMailOptions);
    
    // 如果是测试环境，显示预览链接
    if (!isRealEmailConfig()) {
      const previewURL = nodemailer.getTestMessageUrl(info);
      console.log("📧 Email preview URL:", previewURL);
      return { success: true, info, previewURL };
    }
    
    console.log("📧 Email sent successfully:", info.messageId);
    return { success: true, info };
    
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw error;
  }
};

// 发送注册邀请邮件
const sendRegistrationEmail = async (email, name, token) => {
  const link = `${process.env.FRONTEND_URL}/register?token=${token}`;
  const template = emailTemplates.registration(name, link);
  
  return await sendEmail({
    to: email,
    subject: template.subject,
    html: template.html,
    text: template.text
  });
};

// 测试邮件配置
const testEmailConfig = async () => {
  try {
    const transporter = await createTransporter();
    const verified = await transporter.verify();
    console.log("✅ Email configuration is valid");
    return { success: true, verified };
  } catch (error) {
    console.error("❌ Email configuration test failed:", error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createTransporter,
  emailTemplates,
  emailConfig,
  sendEmail,
  sendRegistrationEmail,
  testEmailConfig,
  isRealEmailConfig,
  validateEmailConfig,
}; 