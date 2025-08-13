import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import { registerUser, clearError, clearRegistrationSuccess, logout } from '../../store/slices/authSlice';
import type { RegistrationForm } from '../../types';

const schema = yup.object({
  username: yup.string().required('Username is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { loading, error, isAuthenticated, registrationSuccess } = useAppSelector((state) => state.auth);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegistrationForm>({
    resolver: yupResolver(schema),
  });

  // Initialize component and clear previous state
  useEffect(() => {
    if (!isInitialized) {
      console.log('🏁 Initializing Register component');
      dispatch(clearError());
      dispatch(clearRegistrationSuccess());
      // Clear any existing authentication state to prevent auto-redirect
      dispatch(logout());
      setIsInitialized(true);
    }
  }, [dispatch, isInitialized]);

  // Handle token validation
  useEffect(() => {
    // Only redirect if no token and component is initialized
    if (isInitialized && !token && !registrationSuccess) {
      console.log('❌ No token provided, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [token, navigate, isInitialized, registrationSuccess]);

  // Handle registration success - prevent authentication redirect during success display
  useEffect(() => {
    console.log('📊 Registration success state changed:', registrationSuccess);
    if (registrationSuccess && !hasRedirected) {
      console.log('🎉 Registration success detected, showing success message');
      setShowSuccessMessage(true);
      
      // Auto redirect to login page after 3 seconds
      const timer = setTimeout(() => {
        console.log('⏰ Auto redirecting to login page');
        setHasRedirected(true);
        dispatch(clearRegistrationSuccess());
        navigate('/login', { 
          replace: true,
          state: { message: 'Registration successful! Please log in with your credentials.' }
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [registrationSuccess, navigate, dispatch, hasRedirected]);

  const onSubmit = async (data: RegistrationForm) => {
    if (!token) return;
    
    console.log('🚀 Starting registration with data:', { ...data, password: '[HIDDEN]' });
    const { confirmPassword, ...registrationData } = data;
    
    try {
      const result = await dispatch(registerUser({ registrationData: registrationData as any, token })).unwrap();
      console.log('✅ Registration API result:', result);
    } catch (error) {
      console.error('❌ Registration failed:', error);
    }
  };

  const handleSuccessSnackbarClose = () => {
    setShowSuccessMessage(false);
  };

  const handleManualRedirect = () => {
    setHasRedirected(true);
    dispatch(clearRegistrationSuccess());
    navigate('/login', { 
      replace: true,
      state: { message: 'Registration successful! Please log in with your credentials.' }
    });
  };

  // Show loading while initializing or if no token (but not if registration was successful)
  if (!isInitialized || (!token && !registrationSuccess)) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            {!token ? 'Invalid registration link...' : 'Loading...'}
          </Typography>
        </Box>
      </Container>
    );
  }

  // Show success state - this takes priority over everything else
  if (registrationSuccess && !hasRedirected) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
            <Box textAlign="center">
              <Typography component="h1" variant="h4" gutterBottom color="success.main">
                🎉 Registration Successful!
              </Typography>
              <Typography variant="h6" gutterBottom color="text.secondary">
                Your account has been created successfully.
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                You will be redirected to the login page in a few seconds to sign in...
              </Typography>
              
              <Box display="flex" justifyContent="center" sx={{ mb: 3 }}>
                <CircularProgress size={32} />
              </Box>
              
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleManualRedirect}
                sx={{ mt: 2 }}
              >
                Go to Login Now
              </Button>
            </Box>
          </Paper>
        </Box>
        
        <Snackbar
          open={showSuccessMessage}
          autoHideDuration={3000}
          onClose={handleSuccessSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleSuccessSnackbarClose} severity="success" sx={{ width: '100%' }}>
            Registration successful! Redirecting to login page...
          </Alert>
        </Snackbar>
      </Container>
    );
  }

  // Normal registration form
  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Employee Management System
          </Typography>
          <Typography component="h2" variant="h5" align="center" gutterBottom>
            Create Account
          </Typography>

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
              id="email"
              label="Email Address"
              autoComplete="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
            <Box textAlign="center">
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Already have an account? Sign In
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 