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
import { fetchVisaStatus, uploadVisaDocument } from '../../store/slices/employeeSlice';

// Import reusable components
import FileUpload from '../../components/forms/FileUpload';
import DocumentViewer from '../../components/documents/DocumentViewer';
import StatusChip from '../../components/common/StatusChip';
import type { Document } from '../../types';

const VisaStatus: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profile, visaStatus, loading, error } = useAppSelector((state) => state.employee);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchVisaStatus());
  }, [dispatch]);

  // Only show this page for OPT visa holders
  const isOPTVisa = profile?.workAuthorization?.visaType === 'f1-cpt-opt';

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
    setUploadingDocument(documentType);
    try {
      await dispatch(uploadVisaDocument({ file, type: documentType })).unwrap();
    } catch (error) {
      console.error('Failed to upload document:', error);
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

  const getStepStatus = (documentType: string) => {
    const document = visaStatus?.documents[documentType as keyof typeof visaStatus.documents];
    if (!document) return 'pending';
    return document.status;
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
      document: visaStatus?.documents?.optReceipt,
    },
    {
      key: 'optEad',
      label: 'OPT EAD',
      description: 'Upload your OPT Employment Authorization Document',
      document: visaStatus?.documents?.optEad,
    },
    {
      key: 'i983',
      label: 'I-983 Form',
      description: 'Download, fill out, and upload the I-983 form',
      document: visaStatus?.documents?.i983,
    },
    {
      key: 'i20',
      label: 'I-20',
      description: 'Upload your new I-20 document',
      document: visaStatus?.documents?.i20,
    },
  ];

  const getCurrentStep = () => {
    if (!visaStatus) return 0;
    
    for (let i = 0; i < steps.length; i++) {
      const stepStatus = getStepStatus(steps[i].key);
      if (stepStatus !== 'approved') {
        return i;
      }
    }
    return steps.length; // All steps completed
  };

  const isStepAvailable = (stepIndex: number) => {
    if (stepIndex === 0) return true; // First step is always available
    
    // Check if previous step is approved
    const previousStep = steps[stepIndex - 1];
    return getStepStatus(previousStep.key) === 'approved';
  };

  const renderStepContent = (step: any, stepIndex: number) => {
    const status = getStepStatus(step.key);
    const isAvailable = isStepAvailable(stepIndex);
    const document = step.document;

    if (!isAvailable) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Please wait for the previous step to be approved before proceeding.
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 2 }}>
        {/* Status Messages */}
        {status === 'pending' && document && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Waiting for HR to approve your {step.label}.
          </Alert>
        )}

        {status === 'approved' && stepIndex < steps.length - 1 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {step.label} approved! Please proceed to the next step.
          </Alert>
        )}

        {status === 'approved' && stepIndex === steps.length - 1 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            All documents have been approved! Your visa status process is complete.
          </Alert>
        )}

        {status === 'rejected' && document?.feedback && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Document rejected - HR feedback:
            </Typography>
            <Typography variant="body2">
              {document.feedback}
            </Typography>
          </Alert>
        )}

        {/* Step-specific content */}
        {step.key === 'optReceipt' && (
          <Box>
            {!document ? (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upload OPT Receipt
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Please upload your OPT Receipt document (submitted during onboarding application).
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <input
                      type="file"
                      accept=".pdf"
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
            ) : (
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
            )}
          </Box>
        )}

        {step.key === 'optEad' && (
          <Box>
            {status === 'approved' && stepIndex > 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Please upload a copy of your OPT EAD.
              </Alert>
            ) : null}
            
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
            {status === 'approved' && stepIndex > 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Please download and fill out the I-983 form.
              </Alert>
            ) : null}

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
                      href="/templates/i983-empty.pdf"
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
                      href="/templates/i983-sample.pdf"
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
            {status === 'approved' && stepIndex > 0 ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Please send the I-983 along with all necessary documents to your school and upload the new I-20.
              </Alert>
            ) : null}

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