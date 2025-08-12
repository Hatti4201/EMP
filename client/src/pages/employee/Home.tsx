import React, { useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchEmployeeProfile } from '../../store/slices/employeeSlice';
import LoadingScreen from '../../components/LoadingScreen';

const EmployeeHome: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { profile, loading } = useAppSelector((state) => state.employee);

  useEffect(() => {
    // Fetch profile data if not already loaded
    if (!profile) {
      console.log('🔄 EmployeeHome: Fetching profile data...');
      dispatch(fetchEmployeeProfile());
    }
  }, [dispatch, profile]);

  // Redirect non-approved users to onboarding
  useEffect(() => {
    if (profile && !loading) {
      const normalizedStatus = profile.onboardingStatus?.trim?.().toLowerCase();
      console.log('🔍 EmployeeHome: Status check:', normalizedStatus);
      
      if (normalizedStatus !== 'approved') {
        console.log('❌ EmployeeHome: Status is not approved, redirecting to onboarding');
        navigate('/employee/onboarding', { replace: true });
      }
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

  // Don't render if not approved (will redirect)
  const normalizedStatus = profile?.onboardingStatus?.trim?.().toLowerCase();
  if (normalizedStatus !== 'approved') {
    return <LoadingScreen />;
  }
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 6,
            textAlign: 'center',
            borderRadius: 2,
            backgroundColor: '#f8f9fa',
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              color: 'primary.main',
              fontWeight: 'bold',
              mb: 3,
            }}
          >
            Welcome to the Employee Portal!
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mt: 2 }}
          >
            Your onboarding application has been approved.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmployeeHome; 