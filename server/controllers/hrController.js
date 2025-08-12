const RegisterToken = require("../models/RegisterToken");
const User = require("../models/User");
const OnboardingApplication = require("../models/OnboardingApplication");
const VisaStatus = require("../models/VisaStatus");
const crypto = require("crypto");
const { sendRegistrationEmail, testEmailConfig, sendEmail } = require("../config/emailConfig");

exports.generateRegisterToken = async (req, res) => {
  const { email, name } = req.body;

  try {
    const token = crypto.randomBytes(20).toString("hex");
    const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);

    await RegisterToken.create({ email, name, token, expiresAt });

    // 发送注册邀请邮件
    const emailResult = await sendRegistrationEmail(email, name, token);
    
    // 准备响应数据
    const link = `${process.env.FRONTEND_URL}/register?token=${token}`;
    const response = {
      success: true,
      message: "Registration token generated and email sent successfully",
      token,
      link,
      emailInfo: {
        messageId: emailResult.info.messageId,
        to: email,
      }
    };

    // 如果是测试模式，添加预览链接
    if (emailResult.previewURL) {
      response.previewURL = emailResult.previewURL;
      response.testMode = true;
      response.message = "Test token generated successfully. Check preview URL in server console.";
    } else {
      response.testMode = false;
    }

    res.json(response);
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    res.status(500).json({ 
      success: false,
      message: "Token generation or email sending failed", 
      error: err.message 
    });
  }
};

// 获取所有注册tokens及其状态
exports.getAllRegistrationTokens = async (req, res) => {
  try {
    // 获取所有tokens
    const tokens = await RegisterToken.find().sort({ createdAt: -1 });
    
    // 为每个token添加onboarding状态信息
    const tokensWithStatus = await Promise.all(
      tokens.map(async (token) => {
        const tokenObj = token.toObject();
        
        // 检查是否已经有用户注册了这个email
        const user = await User.findOne({ email: token.email });
        
        let onboardingStatus = 'not_registered';
        
        if (user) {
          // 用户已注册，检查是否提交了onboarding application
          const application = await OnboardingApplication.findOne({ user: user._id });
          
          if (application) {
            onboardingStatus = application.status; // 'pending', 'approved', 'rejected'
          } else {
            onboardingStatus = 'registered'; // 已注册但未提交onboarding
          }
        }
        
        return {
          ...tokenObj,
          onboardingStatus,
          registrationLink: `${process.env.FRONTEND_URL}/register?token=${token.token}`
        };
      })
    );
    
    res.json({
      success: true,
      tokens: tokensWithStatus,
      total: tokensWithStatus.length
    });
  } catch (err) {
    console.error("❌ Failed to fetch registration tokens:", err);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch registration tokens", 
      error: err.message 
    });
  }
};

// 测试邮件配置
exports.testEmailConfig = async (req, res) => {
  try {
    const result = await testEmailConfig();
    
    if (result.success) {
      res.json({
        success: true,
        message: "Email configuration is valid and working",
        verified: result.verified
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Email configuration test failed",
        error: result.error
      });
    }
  } catch (error) {
    console.error("❌ Email config test error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test email configuration",
      error: error.message
    });
  }
};

// 获取所有员工
exports.getAllEmployees = async (req, res) => {
  try {
    const { search } = req.query;
    console.log('📋 HR fetching all employees...', search ? `with search: ${search}` : '');
    
    // 获取所有用户（员工角色）
    const users = await User.find({ role: 'employee' }).sort({ createdAt: -1 });
    console.log(`✅ Found ${users.length} employee users`);
    
    // 为每个用户获取onboarding application和visa status信息
    const employeesWithDetails = await Promise.all(
      users.map(async (user) => {
        const application = await OnboardingApplication.findOne({ user: user._id });
        const visaStatus = await VisaStatus.findOne({ user: user._id });
        
        // 构建员工信息对象
        const employee = {
          _id: user._id,
          userId: user._id,
          email: user.email,
          username: user.username,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          onboardingStatus: 'never-submitted',
          
          // 如果有onboarding application，填充详细信息
          firstName: '',
          lastName: '',
          middleName: '',
          preferredName: '',
          profilePicture: '',
          ssn: '',
          dateOfBirth: '',
          gender: 'no-answer',
          address: {
            building: '',
            street: '',
            city: '',
            state: '',
            zip: ''
          },
          phoneNumbers: {
            cell: '',
            work: ''
          },
          workAuthorization: {
            isPermanentResident: false,
            visaType: '',
            visaTitle: '',
            startDate: '',
            endDate: ''
          },
          reference: {},
          emergencyContacts: [],
          documents: [],
          visaDocuments: [] // Add visa documents from VisaStatus
        };
        
        if (application) {
          const personalInfo = application.personalInfo;
          
          employee.onboardingStatus = application.status;
          employee.firstName = personalInfo.name?.firstName || '';
          employee.lastName = personalInfo.name?.lastName || '';
          employee.middleName = personalInfo.name?.middleName || '';
          employee.preferredName = personalInfo.name?.preferredName || '';
          employee.profilePicture = personalInfo.profilePicture || '';
          employee.ssn = personalInfo.ssn || '';
          employee.dateOfBirth = personalInfo.dob ? personalInfo.dob.toISOString().split('T')[0] : '';
          employee.gender = personalInfo.gender || 'no-answer';
          employee.address = personalInfo.address || employee.address;
          employee.phoneNumbers = {
            cell: personalInfo.contact?.phone || '',
            work: personalInfo.contact?.workPhone || ''
          };
          employee.workAuthorization = {
            isPermanentResident: personalInfo.visa?.isUSCitizen || false,
            visaType: personalInfo.visa?.visaTitle || '',
            visaTitle: personalInfo.visa?.visaTitle || '',
            startDate: personalInfo.visa?.startDate ? personalInfo.visa.startDate.toISOString().split('T')[0] : '',
            endDate: personalInfo.visa?.endDate ? personalInfo.visa.endDate.toISOString().split('T')[0] : ''
          };
          employee.reference = personalInfo.reference || {};
          employee.emergencyContacts = personalInfo.emergencyContacts || [];
          employee.documents = application.documents || [];
        }
        
        // Combine visa documents from both OnboardingApplication and VisaStatus
        employee.visaDocuments = [];
        
        // 1. Add OPT Receipt - check both OnboardingApplication and VisaStatus
        let optReceiptAdded = false;
        
        // First, try to get OPT Receipt from onboarding application
        if (application && application.personalInfo?.visa?.optReceipt) {
          console.log(`📄 Found OPT Receipt in onboarding for ${employee.firstName}: ${application.personalInfo.visa.optReceipt}`);
          
          // Check if OPT Receipt has been reviewed in VisaStatus
          const optReceiptInVisaStatus = visaStatus?.steps?.find(step => step.type === 'OPT Receipt');
          let optReceiptStatus = optReceiptInVisaStatus?.status || 'pending';
          
          // Apply implicit approval logic for OPT Receipt
          if (optReceiptStatus === 'pending' && visaStatus?.steps) {
            const requiredVisaTypes = ['OPT Receipt', 'OPT EAD', 'I-983', 'I-20'];
            const optReceiptIndex = requiredVisaTypes.indexOf('OPT Receipt');
            
            // Check if any later document is approved
            for (let i = optReceiptIndex + 1; i < requiredVisaTypes.length; i++) {
              const laterStep = visaStatus.steps.find(s => s.type === requiredVisaTypes[i]);
              if (laterStep && laterStep.status === 'approved') {
                console.log(`✅ OPT Receipt for ${employee.firstName} considered approved because ${requiredVisaTypes[i]} is approved`);
                optReceiptStatus = 'approved';
                break;
              }
            }
          }
          
          employee.visaDocuments.push({
            type: 'OPT Receipt',
            status: optReceiptStatus,
            feedback: optReceiptInVisaStatus?.feedback || '',
            uploadedAt: application.submittedAt || new Date(),
            file: application.personalInfo.visa.optReceipt,
            name: application.personalInfo.visa.optReceipt.split('/').pop(),
            url: `${process.env.BASE_URL || 'http://localhost:8000'}${application.personalInfo.visa.optReceipt}`
          });
          optReceiptAdded = true;
        }
        
        // If OPT Receipt not found in onboarding, check VisaStatus directly
        if (!optReceiptAdded && visaStatus?.steps) {
          const optReceiptInVisaStatus = visaStatus.steps.find(step => step.type === 'OPT Receipt');
          if (optReceiptInVisaStatus) {
            console.log(`📄 Found OPT Receipt in VisaStatus for ${employee.firstName}: ${optReceiptInVisaStatus.file}`);
            
            let optReceiptStatus = optReceiptInVisaStatus.status;
            
            // Apply implicit approval logic for OPT Receipt
            if (optReceiptStatus === 'pending') {
              const requiredVisaTypes = ['OPT Receipt', 'OPT EAD', 'I-983', 'I-20'];
              const optReceiptIndex = requiredVisaTypes.indexOf('OPT Receipt');
              
              // Check if any later document is approved
              for (let i = optReceiptIndex + 1; i < requiredVisaTypes.length; i++) {
                const laterStep = visaStatus.steps.find(s => s.type === requiredVisaTypes[i]);
                if (laterStep && laterStep.status === 'approved') {
                  console.log(`✅ OPT Receipt for ${employee.firstName} considered approved because ${requiredVisaTypes[i]} is approved`);
                  optReceiptStatus = 'approved';
                  break;
                }
              }
            }
            
            employee.visaDocuments.push({
              type: 'OPT Receipt',
              status: optReceiptStatus,
              feedback: optReceiptInVisaStatus.feedback || '',
              uploadedAt: optReceiptInVisaStatus.uploadedAt || new Date(),
              file: optReceiptInVisaStatus.file,
              name: optReceiptInVisaStatus.file ? optReceiptInVisaStatus.file.split('/').pop() : 'OPT Receipt',
              url: optReceiptInVisaStatus.file ? `${process.env.BASE_URL || 'http://localhost:8000'}${optReceiptInVisaStatus.file}` : null
            });
            optReceiptAdded = true;
          }
        }
        
        // 2. Add documents from VisaStatus if available (exclude OPT Receipt as it's handled above)
        if (visaStatus && visaStatus.steps) {
          const requiredVisaTypes = ['OPT Receipt', 'OPT EAD', 'I-983', 'I-20'];
          
          // Helper function to get effective status with implicit approval logic
          const getEffectiveStatus = (docType, originalStatus) => {
            if (originalStatus === 'approved' || originalStatus === 'rejected') {
              return originalStatus;
            }
            
            // Check if any later document is approved (implicit approval)
            const currentIndex = requiredVisaTypes.indexOf(docType);
            if (currentIndex >= 0) {
              for (let i = currentIndex + 1; i < requiredVisaTypes.length; i++) {
                const laterStep = visaStatus.steps.find(s => s.type === requiredVisaTypes[i]);
                if (laterStep && laterStep.status === 'approved') {
                  console.log(`✅ ${docType} for ${employee.firstName} considered approved because ${requiredVisaTypes[i]} is approved`);
                  return 'approved';
                }
              }
            }
            
            return originalStatus;
          };
          
          const visaStatusDocs = visaStatus.steps
            .filter(step => step.type !== 'OPT Receipt') // Exclude OPT Receipt to avoid duplication
            .map(step => ({
              type: step.type,
              status: getEffectiveStatus(step.type, step.status),
              feedback: step.feedback,
              uploadedAt: step.uploadedAt,
              file: step.file,
              // Convert to format expected by frontend
              name: step.file ? step.file.split('/').pop() : step.type,
              url: step.file ? `${process.env.BASE_URL || 'http://localhost:8000'}${step.file}` : null
            }));
          employee.visaDocuments.push(...visaStatusDocs);
        }
        
        return employee;
      })
    );
    
    // 如果有搜索参数，进行过滤 - 只搜索 first name, last name, preferred name
    let finalEmployees = employeesWithDetails;
    if (search && search.trim() !== '') {
      const searchTerm = search.toLowerCase();
      finalEmployees = employeesWithDetails.filter(employee => {
        return (
          employee.firstName.toLowerCase().includes(searchTerm) ||
          employee.lastName.toLowerCase().includes(searchTerm) ||
          (employee.preferredName && employee.preferredName.toLowerCase().includes(searchTerm))
        );
      });
      console.log(`🔍 Filtered to ${finalEmployees.length} employees matching search: "${search}"`);
      console.log(`🔍 Search criteria: firstName, lastName, preferredName only`);
    }
    
    console.log(`📊 Returning ${finalEmployees.length} employees with details`);
    res.json({
      success: true,
      data: finalEmployees,
      total: finalEmployees.length
    });
  } catch (error) {
    console.error('❌ Error fetching employees:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: error.message
    });
  }
};

// 根据ID获取员工详情
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👤 HR fetching employee details for ID: ${id}`);
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    const application = await OnboardingApplication.findOne({ user: id });
    
    // 构建详细的员工信息
    const employee = {
      _id: user._id,
      userId: user._id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      onboardingStatus: application ? application.status : 'never-submitted'
    };
    
    if (application) {
      const personalInfo = application.personalInfo;
      Object.assign(employee, {
        firstName: personalInfo.name?.firstName || '',
        lastName: personalInfo.name?.lastName || '',
        middleName: personalInfo.name?.middleName || '',
        preferredName: personalInfo.name?.preferredName || '',
        profilePicture: personalInfo.profilePicture || '',
        ssn: personalInfo.ssn || '',
        dateOfBirth: personalInfo.dob ? personalInfo.dob.toISOString().split('T')[0] : '',
        gender: personalInfo.gender || 'no-answer',
        address: personalInfo.address || {},
        phoneNumbers: {
          cell: personalInfo.contact?.phone || '',
          work: personalInfo.contact?.workPhone || ''
        },
        workAuthorization: {
          isPermanentResident: personalInfo.visa?.isUSCitizen || false,
          visaType: personalInfo.visa?.visaTitle || '',
          visaTitle: personalInfo.visa?.visaTitle || '',
          startDate: personalInfo.visa?.startDate ? personalInfo.visa.startDate.toISOString().split('T')[0] : '',
          endDate: personalInfo.visa?.endDate ? personalInfo.visa.endDate.toISOString().split('T')[0] : ''
        },
        reference: personalInfo.reference || {},
        emergencyContacts: personalInfo.emergencyContacts || [],
        documents: application.documents || []
      });
    }
    
    console.log('✅ Employee details retrieved successfully');
    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    console.error('❌ Error fetching employee by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee details',
      error: error.message
    });
  }
};



// 获取HR仪表板统计数据
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('📊 HR fetching dashboard statistics...');
    
    // 获取员工总数
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    
    // 获取待审批的onboarding申请数量
    const pendingApplications = await OnboardingApplication.countDocuments({ status: 'pending' });
    
    // 获取已批准的申请数量
    const approvedApplications = await OnboardingApplication.countDocuments({ status: 'approved' });
    
    // TODO: 获取待审批的visa文档数量（需要实现visa status系统）
    const pendingVisaDocuments = 0;
    
    const stats = {
      totalEmployees,
      pendingApplications,
      approvedApplications,
      pendingVisaDocuments,
      inProgressVisa: 0 // placeholder
    };
    
    console.log('✅ Dashboard stats retrieved:', stats);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// 获取申请（支持状态查询）
exports.getPendingApplications = async (req, res) => {
  try {
    const { status } = req.query;
    console.log(`📋 HR fetching applications with status: ${status || 'all'}`);
    
    // 构建查询条件
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const applications = await OnboardingApplication.find(query)
      .populate('user', 'email username')
      .sort({ submittedAt: -1 });
    
    console.log(`✅ Found ${applications.length} applications`);
    res.json({
      success: true,
      data: applications,
      total: applications.length
    });
  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// 审核签证文档
exports.reviewVisaDocument = async (req, res) => {
  try {
    const { employeeId, documentType, status, feedback } = req.body;
    console.log(`📋 HR reviewing visa document for employee ${employeeId}:`, {
      documentType,
      status,
      feedback
    });

    // Map frontend document types to backend enum values
    const documentTypeMapping = {
      'opt-receipt': 'OPT Receipt',
      'opt-ead': 'OPT EAD', 
      'i983': 'I-983',
      'i20': 'I-20',
      'OPT Receipt': 'OPT Receipt',
      'OPT EAD': 'OPT EAD',
      'I-983': 'I-983',
      'I-20': 'I-20'
    };

    const mappedDocumentType = documentTypeMapping[documentType] || documentType;
    console.log(`🔄 Mapped document type: ${documentType} → ${mappedDocumentType}`);

    // Special handling for OPT Receipt (comes from onboarding application)
    if (mappedDocumentType === 'OPT Receipt') {
      // For OPT Receipt, we need to handle it in VisaStatus but track that it came from onboarding
      let visaStatus = await VisaStatus.findOne({ user: employeeId });
      
      if (!visaStatus) {
        console.log(`📄 Creating new VisaStatus record for employee ${employeeId}`);
        
        // Get the OPT Receipt file path from onboarding application
        const application = await OnboardingApplication.findOne({ user: employeeId });
        const optReceiptFile = application?.personalInfo?.visa?.optReceipt;
        
        visaStatus = new VisaStatus({
          user: employeeId,
          steps: [{
            type: mappedDocumentType,
            status: status,
            feedback: feedback || '',
            file: optReceiptFile,
            uploadedAt: application?.submittedAt || new Date()
          }]
        });
      } else {
        // Find existing OPT Receipt step or create new one
        let step = visaStatus.steps.find(s => s.type === mappedDocumentType);
        
        if (step) {
          step.status = status;
          step.feedback = feedback || '';
        } else {
          // Get the OPT Receipt file path from onboarding application
          const application = await OnboardingApplication.findOne({ user: employeeId });
          const optReceiptFile = application?.personalInfo?.visa?.optReceipt;
          
          visaStatus.steps.push({
            type: mappedDocumentType,
            status: status,
            feedback: feedback || '',
            file: optReceiptFile,
            uploadedAt: application?.submittedAt || new Date()
          });
        }
      }
      
      await visaStatus.save();
      console.log(`✅ Updated OPT Receipt status for employee ${employeeId}: ${status}`);
    } else {
      // Handle other document types (OPT EAD, I-983, I-20) normally
      let visaStatus = await VisaStatus.findOne({ user: employeeId });
      
      if (!visaStatus) {
        console.log(`📄 Creating new VisaStatus record for employee ${employeeId}`);
        visaStatus = new VisaStatus({
          user: employeeId,
          steps: []
        });
      }

      // 查找对应的文档步骤
      let step = visaStatus.steps.find(s => s.type === mappedDocumentType);
      
      if (step) {
        // 更新现有步骤
        step.status = status;
        step.feedback = feedback || '';
        console.log(`✅ Updated existing document step: ${mappedDocumentType}`);
      } else {
        // 创建新的步骤（如果不存在）
        step = {
          type: mappedDocumentType,
          status: status,
          feedback: feedback || '',
          uploadedAt: new Date()
        };
        visaStatus.steps.push(step);
        console.log(`✅ Created new document step: ${mappedDocumentType}`);
      }

      await visaStatus.save();
    }

    // 检查是否所有visa文件都已approved，如果是则自动将onboarding状态设为approved
    await exports.checkAndUpdateOnboardingStatus(employeeId);

    res.json({
      success: true,
      message: `Document ${status} successfully`
    });
  } catch (error) {
    console.error('❌ Error reviewing visa document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review document',
      error: error.message
    });
  }
};

// 发送通知邮件
exports.sendNotificationEmail = async (req, res) => {
  try {
    const { employeeId, type } = req.body;
    console.log(`📧 HR sending notification email to employee ${employeeId}:`, { type });

    // 获取员工信息
    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    const application = await OnboardingApplication.findOne({ user: employeeId });
    const employeeName = application?.personalInfo?.name?.firstName || user.username;

    // 根据type构建邮件内容
    let subject, htmlContent;
    
    switch (type) {
      case 'next-step':
        subject = 'Action Required: Next Step for Your Visa Documentation';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2;">Action Required: Visa Documentation</h2>
            <p>Dear ${employeeName},</p>
            <p>This is a reminder that you have a pending action for your visa documentation process.</p>
            <p>Please log in to the Employee Management System to check your visa status and complete the next required step.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/employee/visa-status" 
                 style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Check Visa Status
              </a>
            </div>
            <p>If you have any questions, please contact HR.</p>
            <br>
            <p>Best regards,<br>HR Team<br>Employee Management System</p>
          </div>
        `;
        break;
      
      default:
        subject = 'Employee Management System Notification';
        htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1976d2;">Employee Management System</h2>
            <p>Dear ${employeeName},</p>
            <p>You have a notification from the Employee Management System.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}" 
                 style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Access System
              </a>
            </div>
            <p>Best regards,<br>HR Team</p>
          </div>
        `;
    }

    // 发送邮件
    const mailOptions = {
      to: user.email,
      subject: subject,
      html: htmlContent
    };

    const emailResult = await sendEmail(mailOptions);

    console.log(`✅ Notification email sent to ${user.email}`);
    res.json({
      success: true,
      message: 'Notification email sent successfully',
      data: {
        to: user.email,
        type: type,
        messageId: emailResult.info?.messageId
      }
    });
  } catch (error) {
    console.error('❌ Error sending notification email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification email',
      error: error.message
    });
  }
};

// 手动触发检查和更新onboarding状态
exports.triggerOnboardingStatusCheck = async (req, res) => {
  try {
    const { employeeId } = req.params;
    console.log(`🔄 Manual trigger: Checking onboarding status for employee ${employeeId}`);
    
    await exports.checkAndUpdateOnboardingStatus(employeeId);
    
    // Fetch updated status to return
    const OnboardingApplication = require("../models/OnboardingApplication");
    const application = await OnboardingApplication.findOne({ user: employeeId });
    
    res.json({
      success: true,
      message: 'Onboarding status check completed',
      status: application?.status || 'not-found'
    });
  } catch (error) {
    console.error('❌ Error in manual trigger:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check onboarding status',
      error: error.message
    });
  }
};

// 检查并更新onboarding状态的辅助函数
exports.checkAndUpdateOnboardingStatus = async function checkAndUpdateOnboardingStatus(employeeId) {
  try {
    console.log(`🔍 Checking if employee ${employeeId} should be approved...`);
    
    const OnboardingApplication = require("../models/OnboardingApplication");
    const VisaStatus = require("../models/VisaStatus");
    
    const application = await OnboardingApplication.findOne({ user: employeeId });
    const visaStatus = await VisaStatus.findOne({ user: employeeId });
    
    if (!application) {
      console.log(`❌ No onboarding application found for employee ${employeeId}`);
      return;
    }
    
    if (application.status === 'approved') {
      console.log(`✅ Employee ${employeeId} onboarding already approved`);
      return;
    }
    
    // 检查是否填写了所有必要信息
    const personalInfo = application.personalInfo;
    const hasRequiredInfo = (
      personalInfo &&
      personalInfo.name?.firstName &&
      personalInfo.name?.lastName &&
      personalInfo.address &&
      personalInfo.contact &&
      personalInfo.ssn &&
      personalInfo.dob &&
      personalInfo.visa
    );
    
    if (!hasRequiredInfo) {
      console.log(`❌ Employee ${employeeId} has not completed all required information`);
      return;
    }
    
    // 检查visa文件状态
    if (!visaStatus || !visaStatus.steps || visaStatus.steps.length === 0) {
      console.log(`❌ Employee ${employeeId} has no visa documents`);
      return;
    }
    
    // 获取所有必要的visa文件类型
    const requiredVisaTypes = ['OPT Receipt', 'OPT EAD', 'I-983', 'I-20'];
    
    // Check which steps are explicitly approved
    const approvedSteps = visaStatus.steps.filter(s => s.status === 'approved').map(s => s.type);
    console.log(`📋 Approved steps for employee ${employeeId}:`, approvedSteps);
    
    // If later steps are approved, consider earlier steps as implicitly approved
    const getEffectiveStatus = (type) => {
      const step = visaStatus.steps.find(s => s.type === type);
      if (step && step.status === 'approved') {
        return true;
      }
      
      // Check if any later step in the workflow is approved
      const typeIndex = requiredVisaTypes.indexOf(type);
      for (let i = typeIndex + 1; i < requiredVisaTypes.length; i++) {
        const laterStep = visaStatus.steps.find(s => s.type === requiredVisaTypes[i]);
        if (laterStep && laterStep.status === 'approved') {
          console.log(`✅ ${type} considered approved because ${requiredVisaTypes[i]} is approved`);
          return true;
        }
      }
      
      return false;
    };
    
    const allApproved = requiredVisaTypes.every(type => getEffectiveStatus(type));
    
    if (allApproved) {
      console.log(`✅ All visa documents approved for employee ${employeeId}, updating onboarding status to approved`);
      application.status = 'approved';
      await application.save();
      console.log(`🎉 Employee ${employeeId} onboarding application approved!`);
    } else {
      console.log(`❌ Not all visa documents approved for employee ${employeeId}`);
      console.log(`Visa document statuses:`, visaStatus.steps.map(s => `${s.type}: ${s.status}`));
    }
  } catch (error) {
    console.error('❌ Error checking onboarding status:', error);
  }
}
