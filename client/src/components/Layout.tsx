import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Stack
} from '@mui/material';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { logout } from '../store/slices/authSlice';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const navigationItems = [
    // Employee routes
    ...(user?.role === 'employee' || import.meta.env.DEV ? [
      { label: 'Onboarding', path: '/employee/onboarding' },
      { label: 'Personal Info', path: '/employee/personal-information' },
      { label: 'Visa Status', path: '/employee/visa-status' },
    ] : []),
    // HR routes  
    ...(user?.role === 'hr' || import.meta.env.DEV ? [
      { label: 'Dashboard', path: '/hr/home' },
      { label: 'Employee Profiles', path: '/hr/employee-profiles' },
      { label: 'Visa Management', path: '/hr/visa-management' },
      { label: 'Hiring Management', path: '/hr/hiring-management' },
    ] : []),
  ];

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      margin: 0,
      padding: 0,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <AppBar position="static" sx={{ width: '100%' }}>
        <Toolbar sx={{ width: '100%', maxWidth: 'none' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Employee Management System
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mr: 2 }}>
            {navigationItems.map((item) => (
              <Button
                key={item.path}
                color="inherit"
                onClick={() => navigate(item.path)}
                sx={{ 
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
          
          <Button 
            color="inherit" 
            onClick={handleLogout}
            sx={{ 
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      
      <Box 
        component="main" 
        sx={{ 
          width: '100%',
          maxWidth: 'none',
          minHeight: 'calc(100vh - 64px)',
          margin: 0,
          padding: 0,
          backgroundColor: '#f5f5f5',
          flex: 1
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout; 