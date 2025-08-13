import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store';
import { loginUser, clearError, verifyToken } from '../../store/slices/authSlice';
import { fetchEmployeeProfile } from '../../store/slices/employeeSlice';
import type { LoginForm } from '../../types';

const schema = yup.object({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { profile, loading: profileLoading } = useAppSelector((state) => state.employee);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: yupResolver(schema),
  });

  // State to track if we need to refetch user data after login
  const [needsUserRefresh, setNeedsUserRefresh] = useState(false);
  // State to track if we're in the process of redirecting
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Effect to refetch user data after login to get complete profile including onboardingStatus
  useEffect(() => {
    if (isAuthenticated && needsUserRefresh) {
      console.log('🔄 Login: Refetching user data with complete profile...');
      Promise.all([
        dispatch(verifyToken()),
        dispatch(fetchEmployeeProfile())
      ]).then((results) => {
        console.log('✅ Login: User data and profile refreshed:', results[0].payload, results[1].payload);
        setNeedsUserRefresh(false);
      }).catch((error) => {
        console.error('❌ Login: Failed to refresh user data:', error);
        setNeedsUserRefresh(false);
      });
    }
  }, [isAuthenticated, needsUserRefresh, dispatch]);

  // Effect to redirect after we have complete user data
  useEffect(() => {
    if (isAuthenticated && user && !needsUserRefresh) {
      console.log('🔍 Login: User authenticated, checking redirect...', {
        userRole: user.role,
        onboardingStatus: user.onboardingStatus,
        hasOnboardingStatus: 'onboardingStatus' in user
      });

      // For HR users, redirect immediately
      if (user.role === 'hr') {
        console.log('✅ Login: HR user, redirecting to /hr/home');
        setIsRedirecting(true);
        setTimeout(() => {
          navigate('/hr/home', { replace: true });
        }, 100); // Small delay to prevent flash
        return;
      }

      // For employees, check if we have complete data (both user.onboardingStatus and profile)
      if (user.role === 'employee') {
        if (!('onboardingStatus' in user) || user.onboardingStatus === undefined) {
          console.log('⏳ Login: Employee missing onboardingStatus in user object, will refetch...');
          setNeedsUserRefresh(true);
          return;
        }

        // Also check if we have the profile data to ensure EmployeeHome won't show Access Denied
        if (!profile || !profile.onboardingStatus) {
          console.log('⏳ Login: Employee missing profile data, will refetch...', { hasProfile: !!profile, profileStatus: profile?.onboardingStatus });
          setNeedsUserRefresh(true);
          return;
        }

        const normalizedStatus = user.onboardingStatus.trim().toLowerCase();
        const profileStatus = profile.onboardingStatus.trim().toLowerCase();
        
        console.log('🔍 Login: Employee status check:', { 
          userStatus: normalizedStatus, 
          profileStatus: profileStatus,
          statusMatch: normalizedStatus === profileStatus 
        });

        // Use profile status as it's more reliable for UI decisions
        setIsRedirecting(true);
        setTimeout(() => {
          if (profileStatus === 'approved') {
            console.log('✅ Login: Profile status approved, redirecting to /employee/home');
            console.log('✅ Login: Final redirect decision - APPROVED -> /employee/home');
            navigate('/employee/home', { replace: true });
          } else {
            console.log('📝 Login: Profile status not approved, redirecting to /employee/onboarding');
            console.log('📝 Login: Final redirect decision - NOT APPROVED -> /employee/onboarding');
            navigate('/employee/onboarding', { replace: true });
          }
        }, 100); // Small delay to prevent flash
      }
    }
  }, [isAuthenticated, user, needsUserRefresh, navigate]);

  useEffect(() => {
    // Clear error when component mounts
    dispatch(clearError());
    
    // Check for success message from registration
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setShowSuccessSnackbar(true);
      
      // Clear the message from location state
      navigate(location.pathname, { replace: true });
    }
  }, [dispatch, location, navigate]);

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await dispatch(loginUser(data)).unwrap();
      console.log('✅ Login: Login successful, setting refresh flag...');
      setNeedsUserRefresh(true);
    } catch (error) {
      console.error('❌ Login: Login failed:', error);
      // Error is already handled by the slice
    }
  };

  const handleSuccessSnackbarClose = () => {
    setShowSuccessSnackbar(false);
    setSuccessMessage(null);
  };

  // Show loading during redirect to prevent flash
  if (isRedirecting || needsUserRefresh || (isAuthenticated && user?.role === 'employee' && profileLoading)) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ mt: 2 }}>
            {needsUserRefresh ? 'Loading user data...' : 
             (profileLoading ? 'Loading profile...' : 'Redirecting...')}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: 2,
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          padding: 4, 
          width: '100%',
          maxWidth: 500,
          borderRadius: 2
        }}
      >
        <Typography component="h1" variant="h4" align="center" gutterBottom>
          Employee Management System
        </Typography>
        <Typography component="h2" variant="h5" align="center" gutterBottom>
          Sign In
        </Typography>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            autoComplete="username"
            autoFocus
            {...register('username')}
            error={!!errors.username}
            helperText={errors.username?.message}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={6000}
        onClose={handleSuccessSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSuccessSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login; 