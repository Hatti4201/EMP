import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Visibility,
  Download,
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { submitOnboardingApplication, fetchEmployeeProfile, fetchOnboardingApplication, downloadFile, fetchVisaStatus } from '../../store/slices/employeeSlice';

// Import reusable components
import FormField from '../../components/forms/FormField';
import FormSelect from '../../components/forms/FormSelect';
import FileUpload from '../../components/forms/FileUpload';
import StatusChip from '../../components/common/StatusChip';

import type { OnboardingForm } from '../../types';

// Validation schema
const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  middleName: yup.string(),
  preferredName: yup.string(),
  profilePicture: yup.mixed(),
  address: yup.object({
    building: yup.string().required('Building/Apt # is required'),
    street: yup.string().required('Street name is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    zip: yup.string().required('ZIP code is required'),
  }),
  phoneNumbers: yup.object({
    cell: yup.string().required('Cell phone is required'),
    work: yup.string(),
  }),
  ssn: yup.string().required('SSN is required'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  workAuthorization: yup.object({
    isPermanentResident: yup.boolean().required(),
    citizenshipStatus: yup.string().when('isPermanentResident', {
      is: true,
      then: (schema) => schema.required('Citizenship status is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    visaType: yup.string().when('isPermanentResident', {
      is: false,
      then: (schema) => schema.required('Visa type is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    visaTitle: yup.string(),
    startDate: yup.string().when('isPermanentResident', {
      is: false,
      then: (schema) => schema.required('Start date is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
    endDate: yup.string().when('isPermanentResident', {
      is: false,
      then: (schema) => schema.required('End date is required'),
      otherwise: (schema) => schema.notRequired(),
    }),
  }),
  reference: yup.object({
    firstName: yup.string(),
    lastName: yup.string(),
    middleName: yup.string(),
    phone: yup.string(),
    email: yup.string().email('Invalid email'),
    relationship: yup.string(),
  }),
  emergencyContacts: yup.array().of(
    yup.object({
      firstName: yup.string().required('First name is required'),
      lastName: yup.string().required('Last name is required'),
      middleName: yup.string(),
      phone: yup.string().required('Phone is required'),
      email: yup.string().email('Invalid email').required('Email is required'),
      relationship: yup.string().required('Relationship is required'),
    })
  ).min(1, 'At least one emergency contact is required'),
});

const steps = [
  'Personal Information',
  'Address & Contact',
  'Work Authorization',
  'Reference & Emergency Contacts',
  'Documents & Review'
];

const Onboarding: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { profile, onboardingApplication, visaStatus, loading, error } = useAppSelector((state) => state.employee);
  const { user } = useAppSelector((state) => state.auth);

  const methods = useForm<OnboardingForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      preferredName: '',
      address: {
        building: '',
        street: '',
        city: '',
        state: '',
        zip: '',
      },
      phoneNumbers: {
        cell: '',
        work: '',
      },
      ssn: '',
      dateOfBirth: '',
      gender: 'no-answer',
      workAuthorization: {
        isPermanentResident: false,
        citizenshipStatus: undefined,
        visaType: undefined,
        visaTitle: '',
        startDate: '',
        endDate: '',
      },
      reference: {
        firstName: '',
        lastName: '',
        middleName: '',
        phone: '',
        email: '',
        relationship: '',
      },
      emergencyContacts: [{
        firstName: '',
        lastName: '',
        middleName: '',
        phone: '',
        email: '',
        relationship: '',
      }],
    },
    mode: 'onChange',
  });

  const { handleSubmit, watch, setValue, getValues, trigger, formState: { errors: formErrors } } = methods;
  const watchedValues = watch();

  useEffect(() => {
    // Try to fetch profile, but don't block the form if it fails
    dispatch(fetchEmployeeProfile());
    // Fetch existing onboarding application
    dispatch(fetchOnboardingApplication());
    // Fetch visa status to show visa documents
    dispatch(fetchVisaStatus());
  }, [dispatch]);

  useEffect(() => {
    // Pre-fill email from user data
    if (user?.email) {
      // Email is read-only, set in the UI display
      console.log('✅ User email available:', user.email);
    } else {
      console.log('⚠️ No user email found');
    }
  }, [user]);

  // Check application status and redirect accordingly
  useEffect(() => {
    const normalizedStatus = profile?.onboardingStatus?.trim?.().toLowerCase();
    if (normalizedStatus === 'approved') {
      console.log('✅ Onboarding: Status is approved, redirecting to employee home');
      navigate('/employee/home');
    }
  }, [profile, navigate]);

  const handleNext = async () => {
    console.log('🔄 Validating step', activeStep);
    console.log('📝 Current form values:', getValues());
    
    // Define fields to validate for each step
    let fieldsToValidate: string[] = [];
    
    switch (activeStep) {
      case 0: // Personal Information
        fieldsToValidate = ['firstName', 'lastName', 'ssn', 'dateOfBirth', 'gender'];
        break;
      case 1: // Address & Contact
        fieldsToValidate = [
          'address.building', 
          'address.street', 
          'address.city', 
          'address.state', 
          'address.zip',
          'phoneNumbers.cell'
        ];
        break;
      case 2: // Work Authorization
        fieldsToValidate = ['workAuthorization.isPermanentResident'];
        // Add conditional validation based on user selection
        const workAuth = getValues('workAuthorization');
        if (workAuth?.isPermanentResident) {
          fieldsToValidate.push('workAuthorization.citizenshipStatus');
        } else {
          fieldsToValidate.push(
            'workAuthorization.visaType', 
            'workAuthorization.startDate', 
            'workAuthorization.endDate'
          );
          if (workAuth?.visaType === 'other') {
            fieldsToValidate.push('workAuthorization.visaTitle');
          }
        }
        break;
      case 3: // Reference & Emergency Contacts
        // Validate emergency contacts array
        const emergencyContacts = getValues('emergencyContacts') || [];
        console.log('🔍 Emergency contacts data:', emergencyContacts);
        
        if (emergencyContacts.length === 0) {
          alert('Please add at least one emergency contact.');
          return;
        }
        
        // Check if all emergency contacts have required fields
        let allContactsValid = true;
        const missingFields: string[] = [];
        
        emergencyContacts.forEach((contact, index) => {
          const requiredFields = ['firstName', 'lastName', 'phone', 'email', 'relationship'];
          requiredFields.forEach(field => {
            if (!contact[field] || contact[field].trim() === '') {
              allContactsValid = false;
              missingFields.push(`Emergency Contact ${index + 1}: ${field}`);
            }
          });
        });
        
        if (!allContactsValid) {
          alert(`Please fill in all required fields for emergency contacts:\n${missingFields.join('\n')}`);
          return;
        }
        
        // If we get here, emergency contacts are valid
        console.log('✅ Emergency contacts validation passed');
        setActiveStep((prevStep) => prevStep + 1);
        return;
        
      case 4: // Documents & Review
        // No required validation for documents step
        fieldsToValidate = [];
        break;
      default:
        fieldsToValidate = [];
    }
    
    try {
      let isValid = true;
      
      if (fieldsToValidate.length > 0) {
        // Validate only the specified fields for this step
        isValid = await trigger(fieldsToValidate as any);
      }
      
      console.log('✅ Validation result:', isValid);
      console.log('🔍 Fields validated:', fieldsToValidate);
      
      if (isValid) {
        console.log('🎯 Moving to next step');
        setActiveStep((prevStep) => prevStep + 1);
      } else {
        console.log('❌ Validation failed for step', activeStep);
        
        // Get errors for the current step only
        const currentStepErrors = Object.keys(formErrors).filter(field => 
          fieldsToValidate.some(validatedField => 
            field.startsWith(validatedField.split('.')[0])
          )
        );
        
        console.log('Fields with errors in current step:', currentStepErrors);
        
        if (currentStepErrors.length > 0) {
          alert(`Please fill in all required fields in this step before proceeding. Missing: ${currentStepErrors.join(', ')}`);
        } else {
          alert('Please fill in all required fields in this step before proceeding.');
        }
      }
    } catch (error) {
      console.error('❌ Validation error:', error);
      alert('Please check all fields in this step and try again.');
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const onSubmit = async (data: OnboardingForm) => {
    console.log('🚀 Starting onboarding submission...');
    console.log('📝 Form data:', data);
    
    // Check if user has valid token
    const token = localStorage.getItem('authToken');
    console.log('🔑 Auth token exists:', !!token);
    console.log('👤 Current user:', user);
    
    if (!token) {
      console.error('❌ No auth token found in localStorage');
      alert('Authentication error: Please login again');
      navigate('/login');
      return;
    }
    
    try {
      console.log('🔄 Dispatching submitOnboardingApplication...');
      const result = await dispatch(submitOnboardingApplication(data)).unwrap();
      console.log('✅ Submission successful:', result);
      
      // Show success message and redirect
      alert('Application submitted successfully!');
      navigate('/employee/personal-information');
    } catch (error) {
      console.error('❌ Submission failed:', error);
      
      if (typeof error === 'string' && error.includes('token')) {
        alert('Authentication error: Please login again');
        navigate('/login');
      } else {
        alert(`Submission failed: ${error}`);
      }
    }
  };

  // Add a click handler to debug the submit button
  const handleSubmitClick = () => {
    console.log('🖱️ Submit button clicked!');
    console.log('📊 Current form state:');
    console.log('- Active step:', activeStep);
    console.log('- Steps length:', steps.length);
    console.log('- Is last step:', activeStep === steps.length - 1);
    console.log('- Loading state:', loading);
    console.log('- Form values:', getValues());
    
    // Manually trigger form validation
    trigger().then(isValid => {
      console.log('✅ Form validation result:', isValid);
      if (!isValid) {
        console.log('❌ Form validation errors:', methods.formState.errors);
        
        // Detailed debugging for emergencyContacts
        const emergencyContacts = getValues('emergencyContacts');
        console.log('🔍 Emergency contacts detailed check:', emergencyContacts);
        
        if (emergencyContacts && emergencyContacts.length > 0) {
          emergencyContacts.forEach((contact, index) => {
            console.log(`👤 Contact ${index + 1}:`, contact);
            console.log(`- firstName: "${contact.firstName}" (empty: ${!contact.firstName})`);
            console.log(`- lastName: "${contact.lastName}" (empty: ${!contact.lastName})`);
            console.log(`- phone: "${contact.phone}" (empty: ${!contact.phone})`);
            console.log(`- email: "${contact.email}" (empty: ${!contact.email})`);
            console.log(`- relationship: "${contact.relationship}" (empty: ${!contact.relationship})`);
          });
        }
      }
    });
  };

  const addEmergencyContact = () => {
    const currentContacts = getValues('emergencyContacts') || [];
    setValue('emergencyContacts', [
      ...currentContacts,
      {
        firstName: '',
        lastName: '',
        middleName: '',
        phone: '',
        email: '',
        relationship: '',
      },
    ]);
  };

  const removeEmergencyContact = (index: number) => {
    const currentContacts = getValues('emergencyContacts') || [];
    setValue('emergencyContacts', currentContacts.filter((_, i) => i !== index));
  };

  // Helper to determine severity based on application status
  const getStatusSeverity = (status: string) => {
    if (status === 'pending') return 'info';
    if (status === 'rejected') return 'error';
    if (status === 'approved') return 'success';
    return 'warning'; // Default or handle other statuses
  };

  const renderPersonalInfoStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <FormField name="firstName" label="First Name *" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField name="lastName" label="Last Name *" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField name="middleName" label="Middle Name" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField name="preferredName" label="Preferred Name" />
      </Grid>
      <Grid item xs={12}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Email: <strong>{user?.email}</strong> (pre-filled, cannot be edited)
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField name="ssn" label="SSN *" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField 
          name="dateOfBirth" 
          label="Date of Birth *" 
          type="date"
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormSelect
          name="gender"
          label="Gender *"
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'no-answer', label: 'I do not wish to answer' },
          ]}
        />
      </Grid>
      <Grid item xs={12}>
        <FileUpload
          name="profilePicture"
          label="Profile Picture"
          accept="image/*"
          maxSize={5}
        />
      </Grid>
    </Grid>
  );

  const renderAddressContactStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Current Address
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField name="address.building" label="Building/Apt # *" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField name="address.street" label="Street Name *" />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormField name="address.city" label="City *" />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormField name="address.state" label="State *" />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormField name="address.zip" label="ZIP Code *" />
      </Grid>
      
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          Contact Information
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField name="phoneNumbers.cell" label="Cell Phone Number *" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField name="phoneNumbers.work" label="Work Phone Number" />
      </Grid>
    </Grid>
  );

  const renderWorkAuthorizationStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormSelect
          name="workAuthorization.isPermanentResident"
          label="Are you a permanent resident or citizen of the U.S.? *"
          options={[
            { value: true, label: 'Yes' },
            { value: false, label: 'No' },
          ]}
        />
      </Grid>

      {watchedValues.workAuthorization?.isPermanentResident && (
        <Grid item xs={12}>
          <FormSelect
            name="workAuthorization.citizenshipStatus"
            label="Citizenship Status *"
            options={[
              { value: 'green-card', label: 'Green Card' },
              { value: 'citizen', label: 'Citizen' },
            ]}
          />
        </Grid>
      )}

      {!watchedValues.workAuthorization?.isPermanentResident && (
        <>
          <Grid item xs={12}>
            <FormSelect
              name="workAuthorization.visaType"
              label="What is your work authorization? *"
              options={[
                { value: 'h1b', label: 'H1-B' },
                { value: 'l2', label: 'L2' },
                { value: 'f1-cpt-opt', label: 'F1 (CPT/OPT)' },
                { value: 'h4', label: 'H4' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Grid>

          {watchedValues.workAuthorization?.visaType === 'other' && (
            <Grid item xs={12}>
              <FormField name="workAuthorization.visaTitle" label="Please specify visa type *" />
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <FormField 
              name="workAuthorization.startDate" 
              label="Start Date *" 
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormField 
              name="workAuthorization.endDate" 
              label="End Date *" 
              type="date"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {watchedValues.workAuthorization?.visaType === 'f1-cpt-opt' && (
            <Grid item xs={12}>
              <FileUpload
                name="documents.optReceipt"
                label="OPT Receipt *"
                accept=".pdf"
                maxSize={10}
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <FileUpload
              name="documents.workAuthorization"
              label="Work Authorization Document"
              accept=".pdf"
              maxSize={10}
            />
          </Grid>
        </>
      )}
    </Grid>
  );

  const renderContactsStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Reference (Optional)
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Who referred you to this company?
        </Typography>
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormField name="reference.firstName" label="First Name" />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormField name="reference.lastName" label="Last Name" />
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormField name="reference.middleName" label="Middle Name" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField name="reference.phone" label="Phone" />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormField name="reference.email" label="Email" type="email" />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Emergency Contacts *
          </Typography>
          <Button variant="outlined" onClick={addEmergencyContact}>
            Add Contact
          </Button>
        </Box>
      </Grid>

      {watchedValues.emergencyContacts?.map((contact, index) => (
        <Grid item xs={12} key={index}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1">
                Emergency Contact {index + 1}
              </Typography>
              {watchedValues.emergencyContacts!.length > 1 && (
                <Button
                  color="error"
                  onClick={() => removeEmergencyContact(index)}
                >
                  Remove
                </Button>
              )}
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormField name={`emergencyContacts.${index}.firstName`} label="First Name *" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField name={`emergencyContacts.${index}.lastName`} label="Last Name *" />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormField name={`emergencyContacts.${index}.middleName`} label="Middle Name" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormField name={`emergencyContacts.${index}.phone`} label="Phone *" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormField name={`emergencyContacts.${index}.email`} label="Email *" type="email" />
              </Grid>
              <Grid item xs={12}>
                <FormField name={`emergencyContacts.${index}.relationship`} label="Relationship *" />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  const handleDownloadDocument = (document: any) => {
    if (document.url) {
      // Extract filename from URL
      const filename = document.url.split('/').pop() || document.name;
      dispatch(downloadFile(filename));
    }
  };

  const renderPendingView = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Application Status: Pending Review
          </Typography>
          <Typography variant="body1">
            Please wait for HR to review your application. You can view your submitted information and documents below.
          </Typography>
        </Alert>
      </Grid>

      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Visa Documentation
          </Typography>
          
          {(() => {
            console.log('📋 Visa Documentation Data:', {
              visaStatus: visaStatus?.steps
            });
            
            // Create a comprehensive list of visa documents with status
            const visaDocuments = [];
            
            // 1. OPT Receipt - check both sources
            const optReceiptFromVisa = visaStatus?.steps?.find(step => step.type === 'OPT Receipt');
            
            if (optReceiptFromVisa) {
              visaDocuments.push({
                type: 'OPT Receipt',
                status: optReceiptFromVisa.status,
                fileName: optReceiptFromVisa.file ? optReceiptFromVisa.file.split('/').pop() : 'N/A',
                filePath: optReceiptFromVisa.file,
                uploadDate: optReceiptFromVisa.uploadedAt
              });
            }
            
            // 2. Other visa documents from visa status
            if (visaStatus?.steps) {
              const otherDocs = visaStatus.steps
                .filter(step => step.type !== 'OPT Receipt')
                .map(step => ({
                  type: step.type,
                  status: step.status,
                  fileName: step.file ? step.file.split('/').pop() : 'N/A',
                  filePath: step.file,
                  uploadDate: step.uploadedAt
                }));
              visaDocuments.push(...otherDocs);
            }
            
            console.log('📋 Processed visa documents:', visaDocuments);
            
            if (visaDocuments.length === 0) {
              return (
                <Typography variant="body2" color="textSecondary">
                  No visa documents uploaded yet.
                </Typography>
              );
            }
            
            return visaDocuments.map((doc, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {doc.type}: 
                    <Chip 
                      label={doc.status} 
                      size="small" 
                      color={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'warning'}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>
                
                {doc.filePath && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      File: {doc.fileName}
                    </Typography>
                    {doc.uploadDate && (
                      <Typography variant="caption" color="textSecondary">
                        • Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                      </Typography>
                    )}
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => {
                          const url = `http://localhost:8000${doc.filePath}`;
                          window.open(url, '_blank');
                        }}
                      >
                        Preview
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Download />}
                        onClick={async () => {
                          try {
                            const url = `http://localhost:8000${doc.filePath}`;
                            console.log('📥 Downloading file from URL:', url);
                            
                            // Fetch the file as blob
                            const response = await fetch(url);
                            if (!response.ok) {
                              throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            
                            const blob = await response.blob();
                            console.log('📥 File blob received:', blob.size, 'bytes');
                            
                            // Create blob URL and download
                            const blobUrl = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = blobUrl;
                            link.download = doc.fileName || 'document';
                            link.style.display = 'none';
                            
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            // Clean up blob URL
                            setTimeout(() => {
                              window.URL.revokeObjectURL(blobUrl);
                            }, 100);
                            
                            console.log('📥 Download initiated for:', doc.fileName);
                          } catch (error) {
                            console.error('📥 Download failed:', error);
                            alert('Download failed. Please try again.');
                          }
                        }}
                      >
                        Download
                      </Button>
                    </Box>
                  </Box>
                )}
                
                {!doc.filePath && (
                  <Typography variant="body2" color="textSecondary">
                    No file uploaded yet
                  </Typography>
                )}
              </Box>
            ));
          })()}
        </Paper>
      </Grid>
    </Grid>
  );

  const renderDocumentsReviewStep = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Additional Documents
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <FileUpload
          name="documents.driversLicense"
          label="Driver's License"
          accept=".pdf,image/*"
          maxSize={10}
        />
      </Grid>
      
      <Grid item xs={12}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>
          Review Your Information
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Please review all the information you've entered before submitting your application.
        </Typography>
      </Grid>

      {/* Summary of entered data */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Personal Information
          </Typography>
          <Typography variant="body2">
            Name: {watchedValues.firstName} {watchedValues.middleName} {watchedValues.lastName}
            {watchedValues.preferredName && ` (${watchedValues.preferredName})`}
          </Typography>
          <Typography variant="body2">
            Email: {user?.email}
          </Typography>
          <Typography variant="body2">
            Phone: {watchedValues.phoneNumbers?.cell}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      padding: { xs: 2, sm: 3, md: 4 },
      backgroundColor: '#f5f5f5'
    }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Employee Onboarding Application
      </Typography>

      {/* Show application status if exists */}
      {onboardingApplication && (
        <Alert severity={getStatusSeverity(onboardingApplication.status)} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6">
              Application Status: <StatusChip status={onboardingApplication.status} />
            </Typography>
            {onboardingApplication.status === 'pending' && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Please wait for HR to review your application.
              </Typography>
            )}
            {onboardingApplication.status === 'rejected' && onboardingApplication.feedback && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Feedback:</strong> {onboardingApplication.feedback}
              </Typography>
            )}
            {onboardingApplication.status === 'approved' && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Your application has been approved! You can now access other sections.
              </Typography>
            )}
          </Box>
        </Alert>
      )}

      {/* Show pending view if application status is pending */}
      {onboardingApplication && onboardingApplication.status === 'pending' && (
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          {renderPendingView()}
        </Paper>
      )}

      {/* Show form if no application or if rejected (can resubmit) */}
      {(!onboardingApplication || onboardingApplication.status === 'rejected') && (
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <FormProvider {...methods}>
            <form onSubmit={(e) => {
              console.log('📋 Form onSubmit triggered!');
              return handleSubmit(onSubmit)(e);
            }}>
              {/* Progress Stepper */}
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {/* Step Content */}
              <Box sx={{ minHeight: '500px', mb: 4 }}>
                {activeStep === 0 && renderPersonalInfoStep()}
                {activeStep === 1 && renderAddressContactStep()}
                {activeStep === 2 && renderWorkAuthorizationStep()}
                {activeStep === 3 && renderContactsStep()}
                {activeStep === 4 && renderDocumentsReviewStep()}
              </Box>

              {/* Navigation Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                >
                  Back
                </Button>
                
                <Box>
                  {activeStep === steps.length - 1 ? (
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      size="large"
                      onClick={handleSubmitClick}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Submit Application'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      size="large"
                    >
                      Next
                    </Button>
                  )}
                </Box>
              </Box>
            </form>
          </FormProvider>
        </Paper>
      )}
    </Box>
  );
};

export default Onboarding; 