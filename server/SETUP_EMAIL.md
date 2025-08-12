# 邮件发送配置指南

## 配置真实邮件发送

为了发送真实邮件到用户邮箱，你需要配置SMTP服务。本指南提供Gmail的配置方法。

### 方法1：使用Gmail SMTP（推荐）

#### 第1步：启用两步验证
1. 访问 Google账户设置：https://myaccount.google.com/
2. 转到"安全性"选项卡
3. 启用"两步验证"

#### 第2步：生成应用密码
1. 在"安全性"页面，找到"应用密码"
2. 选择"邮件"和"其他"（自定义名称：Employee Management System）
3. 复制生成的16位应用密码

#### 第3步：配置环境变量
在服务器的`.env`文件中设置以下变量：

```bash
# 邮件配置 - Gmail SMTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail_account@gmail.com
EMAIL_PASS=your_16_digit_app_password_here
EMAIL_FROM_NAME=Employee Management System
EMAIL_FROM_ADDRESS=your_gmail_account@gmail.com
```

#### 第4步：重启服务器
```bash
npm restart
# 或
node server.js
```

### 方法2：使用其他邮件服务

#### SendGrid
```bash
EMAIL_PROVIDER=sendgrid
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```

#### Outlook/Hotmail
```bash
EMAIL_PROVIDER=outlook
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_outlook_email@outlook.com
EMAIL_PASS=your_outlook_password
```

### 测试邮件发送

1. 启动服务器
2. 登录HR账户（用户名：hr，密码：123456）
3. 进入Hiring Management页面
4. 点击"Generate Token & Send Email"
5. 输入真实邮箱地址
6. 检查邮箱是否收到邮件

### 故障排除

**错误：Authentication failed**
- 检查Gmail是否启用了两步验证
- 确认使用的是应用密码，不是普通密码
- 检查用户名是否为完整邮箱地址

**错误：Connection timeout**
- 检查网络连接
- 确认端口587未被防火墙阻止
- 尝试使用端口465（需将secure设为true）

**邮件未收到**
- 检查垃圾邮件文件夹
- 确认收件人邮箱地址正确
- 查看服务器控制台日志

### 安全提示

- 不要在代码中硬编码邮箱密码
- 使用应用密码而不是账户密码
- 定期更新应用密码
- 不要将`.env`文件提交到版本控制系统 