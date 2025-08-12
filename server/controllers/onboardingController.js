// controllers/onboardingController.js
const Onboarding = require("../models/OnboardingApplication");

exports.submitApplication = async (req, res) => {
  const userId = req.user.id;
  console.log('📝 Received onboarding application data:', JSON.stringify(req.body, null, 2));
  console.log('👤 User ID from token:', userId);
  
  try {
    console.log('🔍 Checking for existing application...');
    const exists = await Onboarding.findOne({ user: userId });
    console.log('📊 Existing application found:', !!exists);
    
    // Transform frontend data format to backend schema format
    const {
      firstName,
      lastName,
      middleName,
      preferredName,
      profilePicture,
      address,
      phoneNumbers,
      ssn,
      dateOfBirth,
      gender,
      workAuthorization,
      reference,
      emergencyContacts,
      documents
    } = req.body;

    const personalInfo = {
      name: {
        firstName,
        lastName,
        middleName,
        preferredName,
      },
      profilePicture: (profilePicture && typeof profilePicture === 'string') ? profilePicture : null,
      address: address || {},
      contact: {
        phone: phoneNumbers?.cell,
        workPhone: phoneNumbers?.work,
      },
      ssn,
      dob: dateOfBirth ? new Date(dateOfBirth) : null,
      gender,
      visa: {
        isUSCitizen: workAuthorization?.isPermanentResident || false,
        visaTitle: workAuthorization?.visaTitle || workAuthorization?.visaType,
        startDate: workAuthorization?.startDate ? new Date(workAuthorization.startDate) : null,
        endDate: workAuthorization?.endDate ? new Date(workAuthorization.endDate) : null,
        optReceipt: (documents?.optReceipt && typeof documents.optReceipt === 'string') ? documents.optReceipt : null,
      },
      reference: reference || {},
      emergencyContacts: emergencyContacts || [],
    };

    console.log('🔄 Transformed personalInfo:', JSON.stringify(personalInfo, null, 2));

    let application;
    
    if (exists) {
      // Update existing application
      console.log('📝 Updating existing application for user:', userId);
              application = await Onboarding.findOneAndUpdate(
        { user: userId },
        {
          personalInfo,
          documents: documents ? Object.values(documents).filter(doc => doc && typeof doc === 'string' && doc.trim() !== '') : [],
          status: 'pending', // Reset status to pending
          feedback: '', // Clear previous feedback
          submittedAt: new Date()
        },
        { new: true }
      );
      console.log('✅ Successfully updated onboarding application:', application._id);
    } else {
      // Create new application
      console.log('📝 Creating new application for user:', userId);
      application = await Onboarding.create({
        user: userId,
        personalInfo,
        documents: documents ? Object.values(documents).filter(doc => doc && typeof doc === 'string' && doc.trim() !== '') : [],
      });
      console.log('✅ Successfully created onboarding application:', application._id);
    }

    res.status(201).json({ 
      message: exists ? "Application updated successfully" : "Application submitted successfully",
      status: application.status,
      applicationId: application._id
    });
  } catch (err) {
    console.error('❌ Error submitting onboarding application:', err);
    console.error('❌ Error stack:', err.stack);
    console.error('❌ Error name:', err.name);
    console.error('❌ Error details:', JSON.stringify(err, null, 2));
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getApplicationStatus = async (req, res) => {
  try {
    const application = await Onboarding.findOne({ user: req.user.id });
    if (!application) return res.status(404).json({ message: "Not submitted" });

    res.json({ 
      status: application.status, 
      feedback: application.feedback,
      application: application
    });
  } catch (err) {
    console.error('❌ Error getting application status:', err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateApplication = async (req, res) => {
  const userId = req.user.id;
  console.log('📝 Updating onboarding application for user:', userId);
  console.log('📝 Update data received:', JSON.stringify(req.body, null, 2));
  
  try {
    // Transform frontend data format to backend schema format (same as in submitApplication)
    const {
      firstName,
      lastName,
      middleName,
      preferredName,
      profilePicture,
      address,
      phoneNumbers,
      ssn,
      dateOfBirth,
      gender,
      workAuthorization,
      reference,
      emergencyContacts,
      documents
    } = req.body;

    const personalInfo = {
      name: {
        firstName,
        lastName,
        middleName,
        preferredName,
      },
      profilePicture: (profilePicture && typeof profilePicture === 'string') ? profilePicture : null,
      address: address || {},
      contact: {
        phone: phoneNumbers?.cell,
        workPhone: phoneNumbers?.work,
      },
      ssn,
      dob: dateOfBirth ? new Date(dateOfBirth) : null,
      gender,
      visa: {
        isUSCitizen: workAuthorization?.isPermanentResident || false,
        visaTitle: workAuthorization?.visaTitle || workAuthorization?.visaType,
        startDate: workAuthorization?.startDate ? new Date(workAuthorization.startDate) : null,
        endDate: workAuthorization?.endDate ? new Date(workAuthorization.endDate) : null,
        optReceipt: (documents?.optReceipt && typeof documents.optReceipt === 'string') ? documents.optReceipt : null,
      },
      reference: reference || {},
      emergencyContacts: emergencyContacts || [],
    };

    console.log('📝 Transformed personalInfo:', JSON.stringify(personalInfo, null, 2));

    const updateData = {
      personalInfo,
      status: "pending", // Reset status to pending after update
      feedback: "" // Clear feedback
    };

    // Only update documents if they are provided
    if (documents && Object.keys(documents).length > 0) {
      updateData.documents = Object.values(documents).filter(doc => doc && typeof doc === 'string' && doc.trim() !== '');
    }

    const updated = await Onboarding.findOneAndUpdate(
      { user: userId },
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Application not found" });
    }

    console.log('✅ Successfully updated onboarding application:', updated._id);
    res.json({ 
      message: "Application updated successfully", 
      status: updated.status,
      application: updated
    });
  } catch (err) {
    console.error('❌ Error updating application:', err);
    console.error('❌ Error stack:', err.stack);
    res.status(500).json({ message: "Update failed", error: err.message });
  }
};
