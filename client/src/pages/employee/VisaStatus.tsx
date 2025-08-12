import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Warning,
  Error,
  Download,
  Visibility,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchVisaStatus, uploadVisaDocument, fetchOnboardingApplication } from '../../store/slices/employeeSlice';

// Import reusable components
import FileUpload from '../../components/forms/FileUpload';
import DocumentViewer from '../../components/documents/DocumentViewer';
import StatusChip from '../../components/common/StatusChip';
import type { Document } from '../../types';

const VisaStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profile, onboardingApplication, visaStatus, loading, error } = useAppSelector((state) => state.employee);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchVisaStatus());
    dispatch(fetchOnboardingApplication());
  }, [dispatch]);

  // Wait for essential data to load before making visa type determination
  const isDataLoaded = onboardingApplication !== null || profile !== null;

  // Get OPT Receipt from onboarding application
  const getOPTReceiptFromOnboarding = () => {
    // Check if user has submitted OPT Receipt in onboarding application
    return isOPTVisa ? {
      name: 'OPT Receipt (from onboarding)',
      status: 'pending', // Default to pending until HR reviews
      uploadDate: new Date().toISOString(),
      url: '', // Will be populated from actual onboarding data
      type: 'opt-receipt'
    } : null;
  };

  // Check for OPT visa in multiple possible locations
  const getVisaType = () => {
    // First check onboarding application (stored in personalInfo.visa.visaTitle)
    const onboardingVisa = (onboardingApplication as any)?.application?.personalInfo?.visa?.visaTitle;
    
    // Then check profile
    const profileVisa = profile?.workAuthorization?.visaType ||
                       profile?.workAuthorization?.visaTitle;
    
    console.log('🔍 Visa Status Debug Info:');
    console.log('📊 Profile:', profile);
    console.log('📊 Onboarding Application:', onboardingApplication);
    console.log('🎫 Onboarding visa path check:', (onboardingApplication as any)?.application?.personalInfo?.visa);
    console.log('🎫 Onboarding visa info:', onboardingVisa);
    console.log('🎫 Profile visa info:', profileVisa);
    
    return onboardingVisa || profileVisa;
  };

  // Only show this page for OPT visa holders
  const isOPTVisa = getVisaType() === 'f1-cpt-opt';

  // Show loading state while data is being fetched
  if (loading || !isDataLoaded) {
    return (
      <Box sx={{ 
        width: '100%',
        minHeight: '100vh',
        padding: { xs: 2, sm: 3, md: 4 },
        backgroundColor: '#f5f5f5'
      }}>
        <Typography variant="h4" gutterBottom>
          Visa Status Management
        </Typography>
        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress />
        </Box>
      </Box>
    );
  }

  if (!isOPTVisa) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Visa Status Management
        </Typography>
        <Paper sx={{ p: 3 }}>
          <Alert severity="info">
            This page is only available for employees with F1 (CPT/OPT) work authorization.
          </Alert>
        </Paper>
      </Box>
    );
  }

  const handleFileUpload = async (file: File, documentType: string) => {
    console.log('🔄 Starting file upload:', { fileName: file.name, documentType, fileSize: file.size });
    setUploadingDocument(documentType);
    try {
      console.log('📤 Dispatching uploadVisaDocument action...');
      const result = await dispatch(uploadVisaDocument({ file, type: documentType })).unwrap();
      console.log('✅ Upload successful:', result);
      
      // Refresh visa status after successful upload
      console.log('🔄 Refreshing visa status...');
      await dispatch(fetchVisaStatus()).unwrap();
      console.log('✅ Visa status refreshed');
      
      // Show success message
      alert(`Document "${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error('❌ Failed to upload document:', error);
      alert(`Upload failed: ${error}`);
    } finally {
      setUploadingDocument(null);
    }
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const handleDownloadDocument = (document: Document) => {
    window.open(document.url, '_blank');
  };

  // Helper function to get document from steps array
  const getDocumentFromSteps = (documentType: string) => {
    console.log('🔍 getDocumentFromSteps called with:', documentType);
    console.log('🔍 Current visaStatus:', visaStatus);
    
    if (!visaStatus || !visaStatus.steps) {
      console.log('🔍 No visa status or steps found');
      return null;
    }
    
    // Map frontend keys to backend types
    const typeMapping: { [key: string]: string } = {
      'optReceipt': 'OPT Receipt',
      'optEad': 'OPT EAD',
      'i983': 'I-983',
      'i20': 'I-20'
    };
    
    const backendType = typeMapping[documentType];
    console.log('🔍 Looking for backend type:', backendType);
    console.log('🔍 Available steps:', visaStatus.steps.map(s => ({ type: s.type, status: s.status, file: s.file })));
    
    const step = visaStatus.steps.find(s => s.type === backendType);
    console.log('🔍 Found step:', step);
    
    if (!step) return null;
    
    // Convert step format to document format for compatibility
    const document = {
      name: step.file ? step.file.split('/').pop() : step.type,
      type: step.type,
      status: step.status,
      feedback: step.feedback,
      uploadDate: step.uploadedAt,
      url: step.file ? `http://localhost:8000${step.file}` : ''
    };
    
    console.log('🔍 Returning document:', document);
    return document;
  };

  const getStepStatus = (documentType: string) => {
    const document = getDocumentFromSteps(documentType);
    if (document?.status) {
      return document.status;
    }
    
    // If no explicit status but later steps are approved, consider this step approved too
    const stepIndex = steps.findIndex(s => s.key === documentType);
    if (stepIndex >= 0) {
      // Check if any later step is approved
      for (let i = stepIndex + 1; i < steps.length; i++) {
        const laterDoc = getDocumentFromSteps(steps[i].key);
        if (laterDoc?.status === 'approved') {
          console.log(`🔍 Step ${documentType} has no explicit status, but later step ${steps[i].key} is approved, marking as approved`);
          return 'approved';
        }
      }
    }
    
    return 'pending';
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle color="success" />;
      case 'rejected':
        return <Error color="error" />;
      case 'pending':
        return <Warning color="warning" />;
      default:
        return null;
    }
  };

  const steps = [
    {
      key: 'optReceipt',
      label: 'OPT Receipt',
      description: 'Upload your OPT Receipt document',
      document: getDocumentFromSteps('optReceipt'),
    },
    {
      key: 'optEad',
      label: 'OPT EAD',
      description: 'Upload your OPT Employment Authorization Document',
      document: getDocumentFromSteps('optEad'),
    },
    {
      key: 'i983',
      label: 'I-983 Form',
      description: 'Download, fill out, and upload the I-983 form',
      document: getDocumentFromSteps('i983'),
    },
    {
      key: 'i20',
      label: 'I-20',
      description: 'Upload your new I-20 document',
      document: getDocumentFromSteps('i20'),
    },
  ];

  const getCurrentStep = () => {
    if (!visaStatus || !visaStatus.steps) {
      return 0;
    }
    
    for (let i = 0; i < steps.length; i++) {
      const stepStatus = getStepStatus(steps[i].key);
      if (stepStatus !== 'approved') {
        return i;
      }
    }
    return steps.length; // All steps completed
  };

  const isStepAvailable = (stepIndex: number) => {
    const onboardingStatus = profile?.onboardingStatus?.trim?.().toLowerCase();
    
    console.log(`🔓 Checking step availability for step ${stepIndex}:`, {
      stepName: steps[stepIndex]?.label,
      onboardingStatus
    });
    
    // If onboarding is approved, all steps are available
    if (onboardingStatus === 'approved') {
      console.log(`✅ Step ${stepIndex} available: onboarding approved`);
      return true;
    }
    
    // If onboarding is never submitted or rejected, no steps are available
    if (onboardingStatus === 'never-submitted' || onboardingStatus === 'rejected') {
      console.log(`❌ Step ${stepIndex} not available: onboarding ${onboardingStatus}`);
      return false;
    }
    
    // For pending onboarding status, check sequential approval logic
    if (onboardingStatus === 'pending') {
      // First step (OPT Receipt) is always available when onboarding is pending
      if (stepIndex === 0) {
        console.log(`✅ Step ${stepIndex} available: first step with pending onboarding`);
        return true;
      }
      
      // For subsequent steps, check if all previous steps are approved
      console.log(`🔍 Checking previous steps for step ${stepIndex}:`);
      for (let i = 0; i < stepIndex; i++) {
        const previousStepStatus = getStepStatus(steps[i].key);
        console.log(`  - Step ${i} (${steps[i].label}): ${previousStepStatus}`);
        if (previousStepStatus !== 'approved') {
          console.log(`❌ Step ${stepIndex} not available: step ${i} not approved`);
          return false; // Previous step not approved yet
        }
      }
      
      console.log(`✅ Step ${stepIndex} available: all previous steps approved`);
      return true; // All previous steps are approved
    }
    
    // Default: not available
    console.log(`❌ Step ${stepIndex} not available: default case`);
    return false;
  };

  const renderStepContent = (step: any, stepIndex: number) => {
    const status = getStepStatus(step.key);
    const isAvailable = isStepAvailable(stepIndex);
    const document = step.document;
    
    console.log(`🎬 Rendering step: ${step.key}`, {
      status,
      isAvailable,
      document,
      stepIndex,
      onboardingStatus: profile?.onboardingStatus
    });

    // If step is not available AND no document exists, show the blocked message
    if (!isAvailable && !document) {
      const onboardingStatus = profile?.onboardingStatus?.trim?.().toLowerCase();
      let message = "Please wait for the previous step to be approved before proceeding.";
      
      if (onboardingStatus === 'never-submitted') {
        message = "Please complete your onboarding application first.";
      } else if (onboardingStatus === 'rejected') {
        message = "Please resubmit your onboarding application.";
      } else if (onboardingStatus === 'pending' && stepIndex > 0) {
        // Check which previous step is not approved
        for (let i = 0; i < stepIndex; i++) {
          const previousStepStatus = getStepStatus(steps[i].key);
          if (previousStepStatus !== 'approved') {
            message = `Please wait for the ${steps[i].label} to be approved before proceeding.`;
            break;
          }
        }
      }
      
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          {message}
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        {/* Step-specific content */}
        {step.key === 'optReceipt' && (
          <Box>
            {status === 'pending' && document && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Waiting for HR to approve your OPT Receipt.
              </Alert>
            )}
            {status === 'approved' && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Your OPT Receipt has been approved. Please proceed to upload your OPT EAD.
              </Alert>
            )}
            {status === 'rejected' && document?.feedback && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  OPT Receipt rejected - HR feedback:
                </Typography>
                <Typography variant="body2">
                  {document.feedback}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Please upload a new OPT Receipt document.
                </Typography>
              </Alert>
            )}
            
            {!document && isAvailable ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upload OPT Receipt
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Please upload your OPT Receipt document.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      id="opt-receipt-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'opt-receipt');
                        }
                      }}
                    />
                    <label htmlFor="opt-receipt-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUpload />}
                        disabled={uploadingDocument === 'opt-receipt'}
                      >
                        {uploadingDocument === 'opt-receipt' ? 'Uploading...' : 'Upload OPT Receipt'}
                      </Button>
                    </label>
                  </Box>
                </CardContent>
              </Card>
            ) : null}

            {(status === 'rejected' && isAvailable) && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Reupload OPT Receipt
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Upload a new OPT Receipt document to replace the rejected one.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      id="opt-receipt-reupload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'opt-receipt');
                        }
                      }}
                    />
                    <label htmlFor="opt-receipt-reupload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUpload />}
                        disabled={uploadingDocument === 'opt-receipt'}
                        color="warning"
                      >
                        {uploadingDocument === 'opt-receipt' ? 'Uploading...' : 'Upload New OPT Receipt'}
                      </Button>
                    </label>
                  </Box>
                </CardContent>
              </Card>
            )}

            {document && (
              <Card sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Current OPT Receipt
                  </Typography>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="subtitle1">{document.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                      </Typography>
                      <StatusChip status={document.status} sx={{ mt: 1 }} />
                    </Box>
                  </Box>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<Visibility />}
                      onClick={() => handleViewDocument(document)}
                      size="small"
                    >
                      View
                    </Button>
                    <Button
                      startIcon={<Download />}
                      onClick={() => handleDownloadDocument(document)}
                      size="small"
                    >
                      Download
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {step.key === 'optEad' && (
          <Box>
            {/* Show upload message when OPT Receipt is approved and no OPT EAD uploaded yet */}
            {!document && isAvailable && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  OPT Receipt Approved!
                </Typography>
                <Typography variant="body2">
                  Please upload a copy of your OPT EAD.
                </Typography>
              </Alert>
            )}
            
            {status === 'pending' && document && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Waiting for HR to approve your OPT EAD.
              </Alert>
            )}
            {status === 'approved' && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Please download and fill out the I-983 form.
              </Alert>
            )}
            {status === 'rejected' && document?.feedback && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  OPT EAD rejected - HR feedback:
                </Typography>
                <Typography variant="body2">
                  {document.feedback}
                </Typography>
              </Alert>
            )}
            
            {!document && isAvailable ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upload OPT EAD
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Please upload your OPT Employment Authorization Document.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      id="opt-ead-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'opt-ead');
                        }
                      }}
                    />
                    <label htmlFor="opt-ead-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUpload />}
                        disabled={uploadingDocument === 'opt-ead'}
                      >
                        {uploadingDocument === 'opt-ead' ? 'Uploading...' : 'Upload OPT EAD'}
                      </Button>
                    </label>
                  </Box>
                </CardContent>
              </Card>
            ) : document ? (
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">{document.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                      </Typography>
                      <StatusChip status={document.status} sx={{ mt: 1 }} />
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<Visibility />}
                    onClick={() => handleViewDocument(document)}
                  >
                    View
                  </Button>
                  <Button
                    startIcon={<Download />}
                    onClick={() => handleDownloadDocument(document)}
                  >
                    Download
                  </Button>
                </CardActions>
              </Card>
            ) : null}
          </Box>
        )}

        {step.key === 'i983' && (
          <Box>
            {status === 'pending' && document && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Waiting for HR to approve and sign your I-983.
              </Alert>
            )}
            {status === 'approved' && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Please send the I-983 along with all necessary documents to your school and upload the new I-20.
              </Alert>
            )}
            {status === 'rejected' && document?.feedback && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  I-983 Form rejected - HR feedback:
                </Typography>
                <Typography variant="body2">
                  {document.feedback}
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ flex: 1 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Empty Template
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Download the blank I-983 form template.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      startIcon={<Download />}
                      href="/templates/i983-blank.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download Empty
                    </Button>
                  </CardActions>
                </Card>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Sample Template
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Download a sample filled I-983 form for reference.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      startIcon={<Download />}
                      href="/templates/i983-blank.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download Sample
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            </Box>

            {!document && isAvailable ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upload Completed I-983 Form
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Please upload your completed and signed I-983 form.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <input
                      type="file"
                      accept=".pdf"
                      style={{ display: 'none' }}
                      id="i983-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'i983');
                        }
                      }}
                    />
                    <label htmlFor="i983-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUpload />}
                        disabled={uploadingDocument === 'i983'}
                      >
                        {uploadingDocument === 'i983' ? 'Uploading...' : 'Upload I-983 Form'}
                      </Button>
                    </label>
                  </Box>
                </CardContent>
              </Card>
            ) : document ? (
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">{document.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                      </Typography>
                      <StatusChip status={document.status} sx={{ mt: 1 }} />
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<Visibility />}
                    onClick={() => handleViewDocument(document)}
                  >
                    View
                  </Button>
                  <Button
                    startIcon={<Download />}
                    onClick={() => handleDownloadDocument(document)}
                  >
                    Download
                  </Button>
                </CardActions>
              </Card>
            ) : null}
          </Box>
        )}

        {step.key === 'i20' && (
          <Box>
            {status === 'pending' && document && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Waiting for HR to approve your I-20.
              </Alert>
            )}
            {status === 'approved' && (
              <Alert severity="success" sx={{ mb: 2 }}>
                All documents have been approved.
              </Alert>
            )}
            {status === 'rejected' && document?.feedback && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  I-20 rejected - HR feedback:
                </Typography>
                <Typography variant="body2">
                  {document.feedback}
                </Typography>
              </Alert>
            )}

            {!document && isAvailable ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upload New I-20
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Please upload your new I-20 document received from your school.
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      id="i20-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'i20');
                        }
                      }}
                    />
                    <label htmlFor="i20-upload">
                      <Button
                        variant="contained"
                        component="span"
                        startIcon={<CloudUpload />}
                        disabled={uploadingDocument === 'i20'}
                      >
                        {uploadingDocument === 'i20' ? 'Uploading...' : 'Upload I-20'}
                      </Button>
                    </label>
                  </Box>
                </CardContent>
              </Card>
            ) : document ? (
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h6">{document.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                      </Typography>
                      <StatusChip status={document.status} sx={{ mt: 1 }} />
                    </Box>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<Visibility />}
                    onClick={() => handleViewDocument(document)}
                  >
                    View
                  </Button>
                  <Button
                    startIcon={<Download />}
                    onClick={() => handleDownloadDocument(document)}
                  >
                    Download
                  </Button>
                </CardActions>
              </Card>
            ) : null}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: '100vh',
      padding: { xs: 2, sm: 3, md: 4 },
      backgroundColor: '#f5f5f5'
    }}>
      <Typography variant="h4" gutterBottom>
        Visa Status Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          OPT Document Workflow
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Follow the steps below to complete your OPT visa documentation process. 
          Each step must be approved by HR before proceeding to the next.
        </Typography>

        <Stepper activeStep={getCurrentStep()} orientation="vertical" sx={{ mt: 3 }}>
          {steps.map((step, index) => (
            <Step key={step.key}>
              <StepLabel
                icon={getStepIcon(getStepStatus(step.key))}
                optional={
                  <StatusChip status={getStepStatus(step.key)} />
                }
              >
                <Typography variant="h6">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {step.description}
                </Typography>
                {renderStepContent(step, index)}
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {getCurrentStep() === steps.length && (
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Congratulations! All documents have been approved.
            </Typography>
            <Typography variant="body2">
              Your OPT visa documentation process is complete. You can now proceed with your employment.
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* Document Viewer Dialog */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDocument(null);
          }}
          onDownload={() => handleDownloadDocument(selectedDocument)}
          showStatus={true}
        />
      )}
    </Box>
  );
};

export default VisaStatus; 