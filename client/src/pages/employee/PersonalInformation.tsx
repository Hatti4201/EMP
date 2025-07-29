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
import { fetchEmployeeProfile, updateEmployeeProfile } from '../../store/slices/employeeSlice';

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
  name: boolean;
  address: boolean;
  contact: boolean;
  employment: boolean;
  emergencyContact: boolean;
}

const PersonalInformation: React.FC = () => {
  const dispatch = useAppDispatch();
  const { profile, loading, error } = useAppSelector((state) => state.employee);
  const [editingSections, setEditingSections] = useState<EditingSections>({
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

  const { handleSubmit, reset, setValue, getValues } = methods;

  useEffect(() => {
    dispatch(fetchEmployeeProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      // Populate form with profile data
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        middleName: profile.middleName || '',
        preferredName: profile.preferredName || '',
        email: profile.email || '',
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
  }, [profile, reset]);

  const handleEdit = (section: keyof EditingSections) => {
    setEditingSections(prev => ({ ...prev, [section]: true }));
  };

  const handleSave = async (section: keyof EditingSections) => {
    const isValid = await methods.trigger();
    if (isValid) {
      const formData = getValues();
      try {
        await dispatch(updateEmployeeProfile(formData)).unwrap();
        setEditingSections(prev => ({ ...prev, [section]: false }));
      } catch (error) {
        console.error('Failed to update profile:', error);
      }
    }
  };

  const handleCancel = (section: keyof EditingSections) => {
    setCancelingSection(section);
    setShowCancelDialog(true);
  };

  const confirmCancel = () => {
    if (cancelingSection && profile) {
      // Reset form to original values
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        middleName: profile.middleName || '',
        preferredName: profile.preferredName || '',
        email: profile.email || '',
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

          {profile.emergencyContacts?.map((contact, index) => (
            <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1">
                  Emergency Contact {index + 1}
                </Typography>
                {editingSections.emergencyContact && profile.emergencyContacts!.length > 1 && (
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
          ))}
        </Paper>
      </FormProvider>

      {/* Documents Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Documents
        </Typography>
        {profile.documents && profile.documents.length > 0 ? (
          <DocumentList
            documents={profile.documents}
            showStatus={true}
            emptyMessage="No documents uploaded yet."
          />
        ) : (
          <Typography variant="body2" color="textSecondary">
            No documents uploaded yet.
          </Typography>
        )}
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