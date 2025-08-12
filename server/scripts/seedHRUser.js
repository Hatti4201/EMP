// scripts/seedHRUser.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("../models/User");

const createHRUser = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // HR用户信息 - 你可以修改这些信息
    const hrUserData = {
      username: "hr",
      email: "hr@gmail.com", 
      password: "123456", // 请使用强密码
      role: "hr"
    };


    // 加密密码
    const hashedPassword = await bcrypt.hash(hrUserData.password, 10);

    // 创建HR用户
    const hrUser = await User.create({
      username: hrUserData.username,
      email: hrUserData.email,
      password: hashedPassword,
      role: hrUserData.role
    });

    console.log("HR user created successfully!");
    console.log("Username:", hrUser.username);
    console.log("Email:", hrUser.email);
    console.log("Role:", hrUser.role);
    console.log("Created at:", hrUser.createdAt);
    
  } catch (error) {
    console.error("Error creating HR user:", error.message);
  } finally {
    // 关闭数据库连接
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// 运行脚本
createHRUser(); 