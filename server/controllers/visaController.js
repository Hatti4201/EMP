const VisaStatus = require("../models/VisaStatus");
const OnboardingApplication = require("../models/OnboardingApplication");

exports.getVisaSteps = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Employee ${userId} fetching visa status...`);
    
    // Get both VisaStatus and OnboardingApplication
    const visaStatus = await VisaStatus.findOne({ user: userId });
    const application = await OnboardingApplication.findOne({ user: userId });
    
    console.log(`📄 VisaStatus found:`, !!visaStatus);
    console.log(`📄 OnboardingApplication found:`, !!application);
    
    let allSteps = [];
    
    // 1. Check for OPT Receipt from both sources and prioritize the most recent
    let optReceiptStep = null;
    
    // First check VisaStatus for OPT Receipt (this would be from direct upload)
    const optReceiptInVisaStatus = visaStatus?.steps?.find(step => step.type === 'OPT Receipt');
    
    if (optReceiptInVisaStatus) {
      console.log(`📄 Found OPT Receipt in VisaStatus: ${optReceiptInVisaStatus.file}`);
      optReceiptStep = optReceiptInVisaStatus;
    }
    // Fallback to onboarding application if no direct upload found
    else if (application && application.personalInfo?.visa?.optReceipt) {
      console.log(`📄 Found OPT Receipt in onboarding: ${application.personalInfo.visa.optReceipt}`);
      optReceiptStep = {
        type: 'OPT Receipt',
        status: 'pending',
        feedback: '',
        file: application.personalInfo.visa.optReceipt,
        uploadedAt: application.submittedAt || new Date()
      };
    }
    
    if (optReceiptStep) {
      console.log(`📋 OPT Receipt step:`, optReceiptStep);
      allSteps.push(optReceiptStep);
    }
    
    // 2. Add other documents from VisaStatus if available (exclude OPT Receipt since we handled it above)
    if (visaStatus && visaStatus.steps) {
      const otherSteps = visaStatus.steps.filter(step => step.type !== 'OPT Receipt');
      console.log(`📋 Other visa steps:`, otherSteps.length);
      allSteps.push(...otherSteps);
    }
    
    console.log(`✅ Returning ${allSteps.length} visa steps for employee`);
    res.json({ steps: allSteps });
  } catch (err) {
    console.error("❌ Error fetching visa status:", err);
    res.status(500).json({ message: "Error fetching status" });
  }
};

exports.uploadVisaDoc = async (req, res) => {
  const { type } = req.body;
  const file = req.file?.filename;

  if (!file || !type) return res.status(400).json({ message: "Missing type or file" });

  try {
    // Map frontend document types to backend enum values
    const documentTypeMapping = {
      'opt-receipt': 'OPT Receipt',
      'opt-ead': 'OPT EAD', 
      'i983': 'I-983',
      'i20': 'I-20'
    };

    const mappedType = documentTypeMapping[type] || type;
    console.log(`📤 Employee uploading document: ${type} → ${mappedType}`);

    let record = await VisaStatus.findOne({ user: req.user.id });
    const step = {
      type: mappedType,
      file: `/files/${file}`,
      status: "pending",
      uploadedAt: new Date(),
    };

    if (!record) {
      record = await VisaStatus.create({ user: req.user.id, steps: [step] });
    } else {
      // 替换或添加
      const index = record.steps.findIndex((s) => s.type === mappedType);
      if (index !== -1) {
        record.steps[index] = step;
      } else {
        record.steps.push(step);
      }
      await record.save();
    }

    res.json({ message: "Document uploaded" });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
};
