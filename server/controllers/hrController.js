const nodemailer = require("nodemailer");
const RegisterToken = require("../models/RegisterToken");
const crypto = require("crypto");

exports.generateRegisterToken = async (req, res) => {
  const { email, name } = req.body;

  try {
    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    await RegisterToken.create({ email, name, token, expiresAt });

    // ✅ 自动生成 ethereal 邮箱账号
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const link = `${process.env.FRONTEND_URL}/register?token=${token}`;
    const info = await transporter.sendMail({
      from: `"HR Team" <${testAccount.user}>`,
      to: email,
      subject: "Employee Registration Link",
      html: `<p>Hello ${name},</p><p>Click to register: <a href="${link}">${link}</a></p>`,
    });

    const previewURL = nodemailer.getTestMessageUrl(info);
    console.log("📨 Preview URL:", previewURL);

    res.json({ token, link, previewURL }); // 把预览链接也返回前端用于测试
  } catch (err) {
    res.status(500).json({ message: "Token generation failed", error: err.message });
  }
};
