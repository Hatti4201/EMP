import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { store } from './store';
import { useAppDispatch, useAppSelector } from './store';
import { verifyToken } from './store/slices/authSlice';
import { fetchEmployeeProfile } from './store/slices/employeeSlice';

// Import pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmployeeHome from './pages/employee/Home';
import EmployeeOnboarding from './pages/employee/Onboarding';
import EmployeePersonalInfo from './pages/employee/PersonalInformation';
import EmployeeVisaStatus from './pages/employee/VisaStatus';
import HRHome from './pages/hr/Home';
import HREmployeeProfiles from './pages/hr/EmployeeProfiles';
import HREmployeeDetail from './pages/hr/EmployeeDetail';
import HRVisaManagement from './pages/hr/VisaManagement';
import HRHiringManagement from './pages/hr/HiringManagement';
import TestPage from './pages/test/TestPage';

// Import components
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});



function AppContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, loading, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Verify token on app load
    const token = localStorage.getItem('authToken');
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/test" element={<TestPage />} />

          {/* Protected routes - redirect to login if not authenticated */}
          {isAuthenticated ? (
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to={user?.role === 'hr' ? "/hr/home" : "/employee/home"} replace />} />
              
              {/* Employee routes */}
              {user?.role === 'employee' && (
                <>
                  <Route path="/employee/home" element={<EmployeeHome />} />
                  <Route path="/employee/onboarding" element={<EmployeeOnboarding />} />
                  <Route path="/employee/personal-information" element={<EmployeePersonalInfo />} />
                  <Route path="/employee/visa-status" element={<EmployeeVisaStatus />} />
                </>
              )}

              {/* HR routes */}
              {user?.role === 'hr' && (
                <>
                  <Route path="/hr/home" element={<HRHome />} />
                  <Route path="/hr/employee-profiles" element={<HREmployeeProfiles />} />
                  <Route path="/hr/employee-profiles/:employeeId" element={<HREmployeeDetail />} />
                  <Route path="/hr/visa-management" element={<HRVisaManagement />} />
                  <Route path="/hr/hiring-management" element={<HRHiringManagement />} />
                </>
              )}
            </Route>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace />} />
          )}

          {/* Catch-all route */}
          <Route 
            path="*" 
            element={<Navigate to="/login" replace />} 
          />
        </Routes>
      </Router>
    </Box>
  );
}

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <CssBaseline />
          <AppContent />
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
