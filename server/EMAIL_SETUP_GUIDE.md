# 🚀 邮件发送配置指南

## 📋 当前状态

目前系统使用测试邮件服务，邮件不会真正发送到用户邮箱。要启用真实邮件发送，请按照以下步骤配置。

## 🧪 快速测试配置

系统现在提供了邮件配置测试功能：

1. 登录HR账户后，访问测试端点：
   ```
   GET http://localhost:8000/api/hr/test-email
   ```

2. 或在前端添加测试按钮调用此API

## 🔧 配置选项

系统支持多种邮件服务提供商和配置方式：

### 选项1：Gmail SMTP（推荐）

#### 第1步：准备Gmail账户

1. **启用两步验证**
   - 访问：https://myaccount.google.com/security
   - 开启"两步验证"

2. **生成应用密码**
   - 在安全设置中找到"应用密码"
   - 选择应用：邮件
   - 选择设备：其他（输入：Employee Management System）
   - 复制生成的16位密码（形如：abcd efgh ijkl mnop）

#### 第2步：更新服务器配置

打开 `server/.env` 文件，添加/更新以下配置：

```bash
# Gmail SMTP 配置
EMAIL_PROVIDER=gmail
EMAIL_USER=你的Gmail邮箱@gmail.com
EMAIL_PASS=你的16位应用密码
EMAIL_FROM_NAME=Employee Management System
EMAIL_FROM_ADDRESS=你的Gmail邮箱@gmail.com
FRONTEND_URL=http://localhost:5173
```

### 选项2：自定义SMTP服务器

```bash
# 自定义SMTP配置
EMAIL_HOST=你的SMTP服务器地址
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=你的邮箱用户名
EMAIL_PASS=你的邮箱密码
EMAIL_FROM_NAME=Employee Management System
EMAIL_FROM_ADDRESS=你的发件邮箱@example.com
FRONTEND_URL=http://localhost:5173
```

### 选项3：Outlook/Hotmail

```bash
# Outlook/Hotmail 配置
EMAIL_PROVIDER=outlook
EMAIL_USER=你的Outlook邮箱@outlook.com
EMAIL_PASS=你的Outlook密码
EMAIL_FROM_NAME=Employee Management System
EMAIL_FROM_ADDRESS=你的Outlook邮箱@outlook.com
FRONTEND_URL=http://localhost:5173
```

### 选项4：SendGrid（商业用途推荐）

```bash
# SendGrid 配置
EMAIL_PROVIDER=sendgrid
EMAIL_USER=apikey
EMAIL_PASS=你的SendGrid_API密钥
EMAIL_FROM_NAME=Employee Management System
EMAIL_FROM_ADDRESS=你的验证发件邮箱@yourdomain.com
FRONTEND_URL=http://localhost:5173
```

## 🚀 启动和测试

### 第1步：重启服务器

```bash
# 停止当前服务器（Ctrl+C）
# 然后重新启动
node server.js
```

### 第2步：测试配置

#### 方法1：使用API测试端点

```bash
# 需要先获取HR用户的JWT token
curl -X GET http://localhost:8000/api/hr/test-email \
  -H "Authorization: Bearer 你的JWT_TOKEN"
```

#### 方法2：发送实际邮件测试

1. 登录HR账户：
   - 用户名：`hr`
   - 密码：`123456`

2. 进入Hiring Management页面

3. 点击"Generate Token & Send Email"

4. 输入你的真实邮箱地址

5. 检查邮箱（包括垃圾邮件文件夹）

## 📧 支持的邮件服务提供商

| 提供商 | EMAIL_PROVIDER | 推荐场景 |
|--------|----------------|----------|
| Gmail | `gmail` | 个人开发、小型项目 |
| Outlook | `outlook` | 企业环境 |
| SendGrid | `sendgrid` | 商业生产环境 |
| 自定义SMTP | 不设置，使用EMAIL_HOST | 自有邮件服务器 |

## 🚨 故障排除

### 常见错误及解决方案

**❌ "Authentication failed"**
- 确认Gmail开启了两步验证
- 使用应用密码，不是普通密码
- 检查邮箱地址拼写

**❌ "Connection timeout"**
- 检查网络连接
- 确认防火墙未阻止587端口
- 尝试端口465（需设置secure: true）

**❌ "邮件未收到"**
- 检查垃圾邮件文件夹
- 确认收件人邮箱正确
- 查看服务器控制台日志

### 调试技巧

1. **查看服务器日志**
   ```bash
   # 启动服务器时观察控制台输出
   node server.js
   ```

2. **测试API直接调用**
   ```bash
   curl -X POST http://localhost:8000/api/hr/token \
     -H "Content-Type: application/json" \
     -d '{"email":"你的邮箱@example.com","name":"测试用户"}'
   ```

## ✅ 配置成功标志

### 测试端点成功响应
```json
{
  "success": true,
  "message": "Email configuration is valid and working",
  "verified": true
}
```

### 邮件发送成功日志
- ✅ 服务器日志显示："📧 Using gmail email service" 或其他提供商
- ✅ 邮件发送成功："📧 Email sent successfully: xxxxx"
- ✅ 收件箱收到漂亮的HTML邮件

### 配置失败时的显示
- ⚠️ "Using test email account - emails won't be delivered to real addresses"
- ❌ "邮件传输器创建失败: 错误信息"
- 测试端点返回错误响应

## 🔐 安全提示

- ✅ 使用应用密码，不是账户密码
- ✅ 不要将`.env`文件提交到Git
- ✅ 定期更新应用密码
- ✅ 考虑使用专门的发件邮箱

## 💬 需要帮助？

如果配置遇到问题：
1. 检查上述故障排除部分
2. 查看服务器控制台错误信息
3. 确认所有配置信息正确无误

---

**配置完成后，系统将能够发送包含注册链接的精美HTML邮件到员工邮箱！** 🎉 