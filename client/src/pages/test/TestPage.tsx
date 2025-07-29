import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const TestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      padding: { xs: 2, sm: 3, md: 4 },
      backgroundColor: '#f5f5f5'
    }}>
      <Typography variant="h4" gutterBottom>
        🧪 Test Page - Everything Working!
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          ✅ Basic Components Working
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/employee/onboarding')}
          >
            Go to Onboarding
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/hr/home')}
          >
            Go to HR Home
          </Button>
          <Button 
            variant="text" 
            onClick={() => navigate('/login')}
          >
            Go to Login
          </Button>
        </Box>
        
        <Typography variant="body1">
          If you can see this page, the basic React and Material-UI setup is working correctly.
        </Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom color="success.main">
          🎯 Quick Links for Testing:
        </Typography>
        <ul>
          <li><a href="/employee/onboarding">Employee Onboarding</a></li>
          <li><a href="/employee/personal-information">Personal Information</a></li>
          <li><a href="/employee/visa-status">Visa Status</a></li>
          <li><a href="/hr/home">HR Dashboard</a></li>
          <li><a href="/hr/employee-profiles">Employee Profiles</a></li>
          <li><a href="/hr/visa-management">Visa Management</a></li>
          <li><a href="/hr/hiring-management">Hiring Management</a></li>
        </ul>
      </Paper>
    </Box>
  );
};

export default TestPage; 