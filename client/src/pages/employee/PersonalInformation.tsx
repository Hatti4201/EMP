import React, { useEffect, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import { Edit, Save, Cancel } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchEmployeeProfile, updateEmployeeProfile, downloadFile, fetchOnboardingApplication, updateOnboardingApplication, fetchVisaStatus } from '../../store/slices/employeeSlice';

// Import reusable components
import FormField from '../../components/forms/FormField';
import FormSelect from '../../components/forms/FormSelect';
import FileUpload from '../../components/forms/FileUpload';
import DocumentList from '../../components/documents/DocumentList';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusChip from '../../components/common/StatusChip';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  middleName: yup.string(),
  preferredName: yup.string(),
  profilePicture: yup.mixed(),
  email: yup.string().email('Invalid email').required('Email is required'),
  ssn: yup.string().required('SSN is required'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
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
  workAuthorization: yup.object({
    visaTitle: yup.string(),
    startDate: yup.string(),
    endDate: yup.string(),
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
  ),
});

interface EditingSections {
  profilePicture: boolean;
  name: boolean;
  address: boolean;
  contact: boolean;
  employment: boolean;
  emergencyContact: boolean;
}

const PersonalInformation: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profile, onboardingApplication, visaStatus, loading, error } = useAppSelector((state) => state.employee);
  const { user } = useAppSelector((state) => state.auth);

  // Helper function to find profile picture from various possible locations
  const findProfilePicture = (applicationData: any, personalInfo: any): string => {
    // First check the current expected location
    if (personalInfo?.profilePicture) {
      console.log('✅ Found profile picture in personalInfo.profilePicture');
      return personalInfo.profilePicture;
    } 
    // Check if it's stored at application level
    else if (applicationData?.profilePicture) {
      console.log('✅ Found profile picture in applicationData.profilePicture');
      return applicationData.profilePicture;
    }
    // Check if it's stored in documents array (legacy format)
    else if (applicationData?.documents && Array.isArray(applicationData.documents)) {
      const profileDoc = applicationData.documents.find((doc: string) => 
        doc && (doc.includes('profile') || doc.includes('picture'))
      );
      if (profileDoc) {
        console.log('✅ Found profile picture in documents array:', profileDoc);
        return profileDoc;
      }
    }
    return '';
  };
  const [editingSections, setEditingSections] = useState<EditingSections>({
    profilePicture: false,
    name: false,
    address: false,
    contact: false,
    employment: false,
    emergencyContact: false,
  });
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelingSection, setCancelingSection] = useState<keyof EditingSections | null>(null);

  const methods = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      preferredName: '',
      profilePicture: '',
      email: '',
      ssn: '',
      dateOfBirth: '',
      gender: 'no-answer',
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
      workAuthorization: {
        visaTitle: '',
        startDate: '',
        endDate: '',
      },
      emergencyContacts: [],
    },
    mode: 'onChange',
  });

  const { handleSubmit, reset, setValue, getValues, watch } = methods;
  const watchedEmergencyContacts = watch('emergencyContacts') || [];

  useEffect(() => {
    dispatch(fetchEmployeeProfile());
    dispatch(fetchOnboardingApplication());
    dispatch(fetchVisaStatus());
  }, [dispatch]);

  useEffect(() => {
    console.log('🔍 PersonalInformation useEffect triggered');
    console.log('📊 onboardingApplication:', onboardingApplication);
    console.log('📊 profile:', profile);
    console.log('📊 user:', user);
    console.log('📧 user.email:', user?.email);
    console.log('📧 user.username:', user?.username);
    
    // Use onboarding application data as the primary source
    if ((onboardingApplication as any)?.application?.personalInfo) {
      console.log('✅ Using onboarding application data');
      const personalInfo = (onboardingApplication as any).application.personalInfo;
      const applicationData = (onboardingApplication as any).application;
      console.log('📝 personalInfo:', personalInfo);
      console.log('📝 applicationData full structure:', applicationData);
      
      // Check for profile picture in different possible locations
      console.log('🖼️ personalInfo.profilePicture:', personalInfo.profilePicture);
      console.log('🖼️ applicationData.profilePicture:', applicationData.profilePicture);
      console.log('🖼️ applicationData.documents:', applicationData.documents);
      
      const profilePictureUrl = findProfilePicture(applicationData, personalInfo);
      console.log('🖼️ Final profilePictureUrl:', profilePictureUrl);
      
      // Transform backend data format to frontend format
      reset({
        firstName: personalInfo.name?.firstName || '',
        lastName: personalInfo.name?.lastName || '',
        middleName: personalInfo.name?.middleName || '',
        preferredName: personalInfo.name?.preferredName || '',
        profilePicture: profilePictureUrl,
        email: user?.email || '',
        ssn: personalInfo.ssn || '',
        dateOfBirth: personalInfo.dob ? personalInfo.dob.split('T')[0] : '',
        gender: personalInfo.gender || 'no-answer',
        address: personalInfo.address || {
          building: '',
          street: '',
          city: '',
          state: '',
          zip: '',
        },
        phoneNumbers: {
          cell: personalInfo.contact?.phone || '',
          work: personalInfo.contact?.workPhone || '',
        },
        workAuthorization: {
          visaTitle: personalInfo.visa?.visaTitle || '',
          startDate: personalInfo.visa?.startDate ? personalInfo.visa.startDate.split('T')[0] : '',
          endDate: personalInfo.visa?.endDate ? personalInfo.visa.endDate.split('T')[0] : '',
        },
        emergencyContacts: personalInfo.emergencyContacts || [],
      });
    } else if (profile) {
      console.log('⚠️ Using profile fallback data');
      // Fallback to profile data if available
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        middleName: profile.middleName || '',
        preferredName: profile.preferredName || '',
        profilePicture: profile.profilePicture || '',
        email: profile.email || user?.email || '',
        ssn: profile.ssn || '',
        dateOfBirth: profile.dateOfBirth || '',
        gender: profile.gender || 'no-answer',
        address: profile.address || {
          building: '',
          street: '',
          city: '',
          state: '',
          zip: '',
        },
        phoneNumbers: profile.phoneNumbers || {
          cell: '',
          work: '',
        },
        workAuthorization: {
          visaTitle: profile.workAuthorization?.visaTitle || '',
          startDate: profile.workAuthorization?.startDate || '',
          endDate: profile.workAuthorization?.endDate || '',
        },
        emergencyContacts: profile.emergencyContacts || [],
      });
    } else {
      console.log('❌ No data found to populate form');
    }
  }, [onboardingApplication, profile, user, reset]);

  const handleEdit = (section: keyof EditingSections) => {
    setEditingSections(prev => ({ ...prev, [section]: true }));
  };

  const handleSave = async (section: keyof EditingSections) => {
    const isValid = await methods.trigger();
    if (isValid) {
      const formData = getValues();
      console.log('💾 Saving form data:', formData);
      console.log('💾 ProfilePicture in form data:', formData.profilePicture);
      
      try {
        // Add documents field to match OnboardingForm interface
        const updateData = {
          ...formData,
          gender: formData.gender as 'male' | 'female' | 'no-answer',
          documents: {
            driversLicense: undefined,
            workAuthorization: undefined,
            optReceipt: undefined,
          }
        };
        
        console.log('💾 Sending update data:', updateData);
        console.log('💾 ProfilePicture in update data:', updateData.profilePicture);
        
        // Use updateOnboardingApplication instead of updateEmployeeProfile
        const result = await dispatch(updateOnboardingApplication(updateData as any)).unwrap();
        console.log('✅ Update result:', result);
        
        // Force refresh of onboarding application data
        await dispatch(fetchOnboardingApplication()).unwrap();
        
        // Manually update form with the latest profilePicture if it was updated
        if (section === 'profilePicture' && result && result.application) {
          const newProfilePicture = result.application.personalInfo?.profilePicture;
          if (newProfilePicture) {
            console.log('🔄 Manually updating form with new profile picture:', newProfilePicture);
            setValue('profilePicture', newProfilePicture);
          }
        }
        
        setEditingSections(prev => ({ ...prev, [section]: false }));
      } catch (error) {
        console.error('❌ Failed to update profile:', error);
      }
    }
  };

  const handleCancel = (section: keyof EditingSections) => {
    setCancelingSection(section);
    setShowCancelDialog(true);
  };

  const handleDownloadDocument = (document: any) => {
    if (document.url) {
      // Extract filename from URL
      const filename = document.url.split('/').pop() || document.name;
      dispatch(downloadFile(filename));
    }
  };

  const confirmCancel = () => {
    if (cancelingSection) {
      // Reset form to original values using the same logic as in useEffect
      if ((onboardingApplication as any)?.application?.personalInfo) {
        const personalInfo = (onboardingApplication as any).application.personalInfo;
        const applicationData = (onboardingApplication as any).application;
        const profilePictureUrl = findProfilePicture(applicationData, personalInfo);
        
        // Reset form with original onboarding data
        reset({
          firstName: personalInfo.name?.firstName || '',
          lastName: personalInfo.name?.lastName || '',
          middleName: personalInfo.name?.middleName || '',
          preferredName: personalInfo.name?.preferredName || '',
          profilePicture: profilePictureUrl,
          email: user?.email || '',
          ssn: personalInfo.ssn || '',
          dateOfBirth: personalInfo.dob ? personalInfo.dob.split('T')[0] : '',
          gender: personalInfo.gender || 'no-answer',
          address: personalInfo.address || {
            building: '',
            street: '',
            city: '',
            state: '',
            zip: '',
          },
          phoneNumbers: {
            cell: personalInfo.contact?.phone || '',
            work: personalInfo.contact?.workPhone || '',
          },
          workAuthorization: {
            visaTitle: personalInfo.visa?.visaTitle || '',
            startDate: personalInfo.visa?.startDate ? personalInfo.visa.startDate.split('T')[0] : '',
            endDate: personalInfo.visa?.endDate ? personalInfo.visa.endDate.split('T')[0] : '',
          },
          emergencyContacts: personalInfo.emergencyContacts || [],
        });
      } else if (profile) {
        // Fallback to profile data if available
        reset({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          middleName: profile.middleName || '',
          preferredName: profile.preferredName || '',
          profilePicture: profile.profilePicture || '',
          email: profile.email || user?.email || '',
          ssn: profile.ssn || '',
          dateOfBirth: profile.dateOfBirth || '',
          gender: profile.gender || 'no-answer',
          address: profile.address || {
            building: '',
            street: '',
            city: '',
            state: '',
            zip: '',
          },
          phoneNumbers: profile.phoneNumbers || {
            cell: '',
            work: '',
          },
          workAuthorization: {
            visaTitle: profile.workAuthorization?.visaTitle || '',
            startDate: profile.workAuthorization?.startDate || '',
            endDate: profile.workAuthorization?.endDate || '',
          },
          emergencyContacts: profile.emergencyContacts || [],
        });
      }
      setEditingSections(prev => ({ ...prev, [cancelingSection]: false }));
    }
    setShowCancelDialog(false);
    setCancelingSection(null);
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

  if (!profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: '100vh', 
      padding: { xs: 2, sm: 3, md: 4 },
      backgroundColor: '#f5f5f5'
    }}>
      <Typography variant="h4" gutterBottom>
        Personal Information
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <FormProvider {...methods}>
        {/* Profile Picture Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Profile Picture</Typography>
            {!editingSections.profilePicture ? (
              <Button startIcon={<Edit />} onClick={() => handleEdit('profilePicture')}>
                Edit
              </Button>
            ) : (
              <Box>
                <Button
                  startIcon={<Cancel />}
                  onClick={() => handleCancel('profilePicture')}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  startIcon={<Save />}
                  variant="contained"
                  onClick={() => handleSave('profilePicture')}
                >
                  Save
                </Button>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* Current Profile Picture Display */}
            <Box sx={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              border: '2px solid #ddd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: '#f5f5f5'
            }}>
              {(() => {
                const profilePictureUrl = watch('profilePicture');
                console.log('🖼️ Current profile picture URL:', profilePictureUrl);
                
                                 if (profilePictureUrl && typeof profilePictureUrl === 'string' && profilePictureUrl.trim()) {
                   // Ensure URL is absolute for server files
                   let imageUrl = profilePictureUrl;
                   if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
                     // If it's a relative path, make it absolute
                     const serverUrl = 'http://localhost:8000';
                     if (imageUrl.startsWith('/files/')) {
                       // Handle /files/filename.jpg format
                       const filename = imageUrl.split('/').pop();
                       imageUrl = `${serverUrl}/api/files/${filename}`;
                     } else if (imageUrl.startsWith('/')) {
                       // Handle other absolute paths
                       imageUrl = `${serverUrl}/api${imageUrl}`;
                     } else if (imageUrl.startsWith('uploads/')) {
                       // Handle uploads/filename.jpg format
                       imageUrl = `${serverUrl}/api/files/${imageUrl.split('/').pop()}`;
                     } else {
                       // Assume it's just a filename
                       imageUrl = `${serverUrl}/api/files/${imageUrl}`;
                     }
                   }
                  
                  console.log('🖼️ Final image URL:', imageUrl);
                  
                  return (
                    <img 
                      src={imageUrl} 
                      alt="Profile" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                      onError={(e) => {
                        console.error('❌ Error loading profile picture from URL:', imageUrl);
                        console.error('❌ Original URL was:', profilePictureUrl);
                        // Hide the broken image and show placeholder
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('✅ Successfully loaded profile picture from:', imageUrl);
                      }}
                    />
                  );
                } else {
                  return (
                    <Typography variant="body2" color="textSecondary" textAlign="center">
                      No profile picture uploaded
                    </Typography>
                  );
                }
              })()}
            </Box>

            {/* File Upload Component */}
            <Box sx={{ flex: 1 }}>
              {editingSections.profilePicture && (
                <FileUpload
                  name="profilePicture"
                  label="Upload Profile Picture"
                  accept="image/*"
                  rules={{
                    required: false
                  }}
                />
              )}
            </Box>
          </Box>
        </Paper>

        {/* Name Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Name</Typography>
            {!editingSections.name ? (
              <Button startIcon={<Edit />} onClick={() => handleEdit('name')}>
                Edit
              </Button>
            ) : (
              <Box>
                <Button
                  startIcon={<Cancel />}
                  onClick={() => handleCancel('name')}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  startIcon={<Save />}
                  variant="contained"
                  onClick={() => handleSave('name')}
                >
                  Save
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormField 
                name="firstName" 
                label="First Name" 
                disabled={!editingSections.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField 
                name="lastName" 
                label="Last Name" 
                disabled={!editingSections.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField 
                name="middleName" 
                label="Middle Name" 
                disabled={!editingSections.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField 
                name="preferredName" 
                label="Preferred Name" 
                disabled={!editingSections.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField 
                name="email" 
                label="Email" 
                type="email"
                disabled={!editingSections.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField 
                name="ssn" 
                label="SSN" 
                disabled={!editingSections.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField 
                name="dateOfBirth" 
                label="Date of Birth" 
                type="date"
                InputLabelProps={{ shrink: true }}
                disabled={!editingSections.name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormSelect
                name="gender"
                label="Gender"
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'no-answer', label: 'I do not wish to answer' },
                ]}
                disabled={!editingSections.name}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Address Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Address</Typography>
            {!editingSections.address ? (
              <Button startIcon={<Edit />} onClick={() => handleEdit('address')}>
                Edit
              </Button>
            ) : (
              <Box>
                <Button
                  startIcon={<Cancel />}
                  onClick={() => handleCancel('address')}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  startIcon={<Save />}
                  variant="contained"
                  onClick={() => handleSave('address')}
                >
                  Save
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormField 
                name="address.building" 
                label="Building/Apt #" 
                disabled={!editingSections.address}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField 
                name="address.street" 
                label="Street Name" 
                disabled={!editingSections.address}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormField 
                name="address.city" 
                label="City" 
                disabled={!editingSections.address}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormField 
                name="address.state" 
                label="State" 
                disabled={!editingSections.address}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormField 
                name="address.zip" 
                label="ZIP Code" 
                disabled={!editingSections.address}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Contact Info Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Contact Information</Typography>
            {!editingSections.contact ? (
              <Button startIcon={<Edit />} onClick={() => handleEdit('contact')}>
                Edit
              </Button>
            ) : (
              <Box>
                <Button
                  startIcon={<Cancel />}
                  onClick={() => handleCancel('contact')}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  startIcon={<Save />}
                  variant="contained"
                  onClick={() => handleSave('contact')}
                >
                  Save
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormField 
                name="phoneNumbers.cell" 
                label="Cell Phone Number" 
                disabled={!editingSections.contact}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormField 
                name="phoneNumbers.work" 
                label="Work Phone Number" 
                disabled={!editingSections.contact}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Employment Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Employment</Typography>
            {!editingSections.employment ? (
              <Button startIcon={<Edit />} onClick={() => handleEdit('employment')}>
                Edit
              </Button>
            ) : (
              <Box>
                <Button
                  startIcon={<Cancel />}
                  onClick={() => handleCancel('employment')}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  startIcon={<Save />}
                  variant="contained"
                  onClick={() => handleSave('employment')}
                >
                  Save
                </Button>
              </Box>
            )}
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormField 
                name="workAuthorization.visaTitle" 
                label="Visa Title" 
                disabled={!editingSections.employment}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormField 
                name="workAuthorization.startDate" 
                label="Start Date" 
                type="date"
                InputLabelProps={{ shrink: true }}
                disabled={!editingSections.employment}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormField 
                name="workAuthorization.endDate" 
                label="End Date" 
                type="date"
                InputLabelProps={{ shrink: true }}
                disabled={!editingSections.employment}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Emergency Contacts Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Emergency Contacts</Typography>
            {!editingSections.emergencyContact ? (
              <Button startIcon={<Edit />} onClick={() => handleEdit('emergencyContact')}>
                Edit
              </Button>
            ) : (
              <Box>
                <Button
                  startIcon={<Cancel />}
                  onClick={() => handleCancel('emergencyContact')}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button
                  startIcon={<Save />}
                  variant="contained"
                  onClick={() => handleSave('emergencyContact')}
                >
                  Save
                </Button>
              </Box>
            )}
          </Box>

          {editingSections.emergencyContact && (
            <Button variant="outlined" onClick={addEmergencyContact} sx={{ mb: 2 }}>
              Add Emergency Contact
            </Button>
          )}

          {/* Debug info for emergency contacts */}
          {console.log('🔍 watchedEmergencyContacts:', watchedEmergencyContacts)}
          
          {watchedEmergencyContacts.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 3 }}>
              No emergency contacts added yet.
              {editingSections.emergencyContact && ' Click "Add Emergency Contact" to add one.'}
            </Typography>
          ) : (
            watchedEmergencyContacts.map((contact: any, index: number) => (
            <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">
                  Emergency Contact {index + 1}
                </Typography>
                {editingSections.emergencyContact && watchedEmergencyContacts.length > 1 && (
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
                  <FormField 
                    name={`emergencyContacts.${index}.firstName`} 
                    label="First Name" 
                    disabled={!editingSections.emergencyContact}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormField 
                    name={`emergencyContacts.${index}.lastName`} 
                    label="Last Name" 
                    disabled={!editingSections.emergencyContact}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormField 
                    name={`emergencyContacts.${index}.middleName`} 
                    label="Middle Name" 
                    disabled={!editingSections.emergencyContact}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField 
                    name={`emergencyContacts.${index}.phone`} 
                    label="Phone" 
                    disabled={!editingSections.emergencyContact}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField 
                    name={`emergencyContacts.${index}.email`} 
                    label="Email" 
                    type="email"
                    disabled={!editingSections.emergencyContact}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormField 
                    name={`emergencyContacts.${index}.relationship`} 
                    label="Relationship" 
                    disabled={!editingSections.emergencyContact}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))
          )}
        </Paper>
      </FormProvider>

      {/* Documents Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Documents
        </Typography>
        {(() => {
          console.log('🔍 Collecting documents from all sources...');
          
          // 1. Documents from onboarding application
          const appDocs = (onboardingApplication as any)?.application?.documents || [];
          console.log('📁 Onboarding application documents:', appDocs);
          
          // 2. Documents from profile
          const profileDocs = profile?.documents || [];
          console.log('📁 Profile documents:', profileDocs);
          
          // 3. Documents from visa status (visa uploads)
          const visaDocs = visaStatus?.steps || [];
          console.log('📁 Visa status documents:', visaDocs);
          
          // Transform onboarding application documents
          const transformedAppDocs = appDocs
            .filter((docPath: string) => docPath && typeof docPath === 'string' && docPath.trim() !== '')
            .map((docPath: string, index: number) => {
              const filename = docPath.split('/').pop() || `Document ${index + 1}`;
              const fileExtension = filename.split('.').pop()?.toLowerCase();
              
              // Determine document type based on filename
              let docType: 'profile-picture' | 'drivers-license' | 'work-authorization' | 'opt-receipt' | 'opt-ead' | 'i983' | 'i20' = 'work-authorization';
              if (filename.toLowerCase().includes('license') || filename.toLowerCase().includes('driver')) {
                docType = 'drivers-license';
              } else if (filename.toLowerCase().includes('opt')) {
                docType = 'opt-receipt';
              } else if (filename.toLowerCase().includes('i983')) {
                docType = 'i983';
              } else if (filename.toLowerCase().includes('i20')) {
                docType = 'i20';
              }
              
              // Determine MIME type
              let mimeType = 'application/octet-stream';
              if (fileExtension === 'pdf') {
                mimeType = 'application/pdf';
              } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
                mimeType = `image/${fileExtension}`;
              }
              
              return {
                _id: `app-doc-${index}`,
                name: filename,
                type: docType,
                mimeType: mimeType,
                url: docPath,
                uploadDate: new Date().toISOString(),
                status: 'approved' as const,
                source: 'onboarding'
              };
            });
          
          // Transform visa status documents
          const transformedVisaDocs = visaDocs
            .filter(step => step.file && step.file.trim() !== '')
            .map((step, index) => {
              const filename = step.file ? step.file.split('/').pop() || step.type : step.type;
              const fileExtension = filename.split('.').pop()?.toLowerCase();
              
              // Determine document type based on step type
              let docType: 'profile-picture' | 'drivers-license' | 'work-authorization' | 'opt-receipt' | 'opt-ead' | 'i983' | 'i20' = 'work-authorization';
              if (step.type === 'OPT Receipt') {
                docType = 'opt-receipt';
              } else if (step.type === 'OPT EAD') {
                docType = 'opt-ead';
              } else if (step.type === 'I-983') {
                docType = 'i983';
              } else if (step.type === 'I-20') {
                docType = 'i20';
              }
              
              // Determine MIME type
              let mimeType = 'application/octet-stream';
              if (fileExtension === 'pdf') {
                mimeType = 'application/pdf';
              } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '')) {
                mimeType = `image/${fileExtension}`;
              }
              
              return {
                _id: `visa-doc-${index}`,
                name: filename,
                type: docType,
                mimeType: mimeType,
                url: step.file,
                uploadDate: step.uploadedAt || new Date().toISOString(),
                status: step.status as 'pending' | 'approved' | 'rejected',
                feedback: step.feedback,
                source: 'visa'
              };
            });
          
          console.log('📄 Transformed onboarding documents:', transformedAppDocs);
          console.log('📄 Transformed visa documents:', transformedVisaDocs);
          
          // Combine all documents from different sources
          const allDocuments = [
            ...transformedAppDocs,
            ...transformedVisaDocs,
            ...profileDocs.filter((doc: any) => doc && typeof doc === 'object')
          ];
          
          // Remove duplicates based on filename (keep the most recent)
          const uniqueDocuments = allDocuments.reduce((acc: any[], doc: any) => {
            const existingIndex = acc.findIndex(existing => existing.name === doc.name);
            if (existingIndex >= 0) {
              // Keep the document with the most recent upload date or visa source priority
              const existing = acc[existingIndex];
              if (doc.source === 'visa' || new Date(doc.uploadDate) > new Date(existing.uploadDate)) {
                acc[existingIndex] = doc;
              }
            } else {
              acc.push(doc);
            }
            return acc;
          }, []);
          
          console.log('📄 Final unique documents:', uniqueDocuments);
          
          return uniqueDocuments && uniqueDocuments.length > 0 ? (
            <DocumentList
              documents={uniqueDocuments}
              onDownload={handleDownloadDocument}
              showStatus={true}
              emptyMessage="No documents uploaded yet."
            />
          ) : (
            <Typography variant="body2" color="textSecondary">
              No documents uploaded yet.
            </Typography>
          );
        })()}
      </Paper>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={confirmCancel}
        title="Discard Changes"
        message="Are you sure you want to discard all changes made to this section?"
        confirmText="Discard"
        confirmColor="error"
      />
    </Box>
  );
};

export default PersonalInformation; 