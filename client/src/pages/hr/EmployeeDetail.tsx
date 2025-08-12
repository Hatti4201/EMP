import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Link,
  Breadcrumbs,
  Alert,
} from '@mui/material';

import {
  ArrowBack,
  Person,
  Email,
  Phone,
  Work,
  Security,
  Assessment,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchAllEmployees } from '../../store/slices/hrSlice';
import LoadingScreen from '../../components/LoadingScreen';
import StatusChip from '../../components/common/StatusChip';
import type { Employee } from '../../types';

const EmployeeDetail: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { employees, loading } = useAppSelector((state) => state.hr);
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    // Fetch employees if not already loaded
    if (employees.length === 0) {
      dispatch(fetchAllEmployees());
    }
  }, [dispatch, employees.length]);

  useEffect(() => {
    // Find the specific employee when employees are loaded
    if (employees.length > 0 && employeeId) {
      console.log('🔍 EmployeeDetail debug:', {
        employeeId: employeeId,
        employeesCount: employees.length,
        employeeIds: employees.map(emp => ({ _id: emp._id, userId: emp.userId, name: `${emp.firstName} ${emp.lastName}` }))
      });
      
      const foundEmployee = employees.find(emp => emp._id === employeeId || emp.userId === employeeId);
      console.log('🎯 Found employee:', foundEmployee ? `${foundEmployee.firstName} ${foundEmployee.lastName}` : 'Not found');
      setEmployee(foundEmployee || null);
    }
  }, [employees, employeeId]);

  const handleGoBack = () => {
    navigate('/hr/employee-profiles');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!employee && !loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Employee not found. Please check the URL or return to the employee list.
        </Alert>
        <Typography variant="body2" sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
          Debug Info:<br />
          - Employee ID from URL: {employeeId}<br />
          - Total employees loaded: {employees.length}<br />
          - Available employee IDs: {employees.slice(0, 3).map(emp => emp._id || emp.userId).join(', ')}
          {employees.length > 3 && '...'}
        </Typography>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={handleGoBack}
          sx={{ mt: 2 }}
        >
          Back to Employee Profiles
        </Button>
      </Container>
    );
  }

  if (!employee) {
    return <LoadingScreen />;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link 
            color="inherit" 
            href="#" 
            onClick={(e) => { e.preventDefault(); handleGoBack(); }}
            sx={{ textDecoration: 'none' }}
          >
            Employee Profiles
          </Link>
          <Typography color="text.primary">
            {employee.firstName} {employee.lastName}
          </Typography>
        </Breadcrumbs>

        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Person sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" component="h1">
                Employee Profile
              </Typography>
              <Typography variant="h6" color="textSecondary">
                Complete Information
              </Typography>
            </Box>
          </Box>
          <Button 
            startIcon={<ArrowBack />} 
            onClick={handleGoBack}
            variant="outlined"
          >
            Back to List
          </Button>
        </Box>
      </Box>

      {/* Employee Information Card */}
      <Paper sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Name */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Person color="primary" />
              <Typography variant="h6" color="primary">
                Full Name
              </Typography>
            </Box>
            <Typography variant="h5" fontWeight="medium">
              {employee.firstName} {employee.middleName} {employee.lastName}
            </Typography>
            {employee.preferredName && (
              <Typography variant="body1" color="textSecondary">
                Preferred: {employee.preferredName}
              </Typography>
            )}
          </Box>

          {/* Row 1: SSN and Application Status */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 4 }}>
            {/* SSN */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Security color="primary" />
                <Typography variant="h6" color="primary">
                  SSN
                </Typography>
              </Box>
              <Typography variant="h6" fontFamily="monospace">
                {employee.ssn ? `***-**-${employee.ssn.slice(-4)}` : 'N/A'}
              </Typography>
            </Box>

            {/* Application Status */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Assessment color="primary" />
                <Typography variant="h6" color="primary">
                  Application Status
                </Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <StatusChip status={employee.onboardingStatus} />
              </Box>
            </Box>
          </Box>

          {/* Work Authorization */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Work color="primary" />
              <Typography variant="h6" color="primary">
                Work Authorization
              </Typography>
            </Box>
            <Box sx={{ mt: 1 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Status:</strong> {employee.workAuthorization?.isPermanentResident ? 
                  `${employee.workAuthorization.citizenshipStatus?.toUpperCase()}` : 
                  'Non-permanent resident'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Visa Type:</strong> {employee.workAuthorization?.visaTitle || 'N/A'}
              </Typography>
              {employee.workAuthorization?.startDate && (
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Start Date:</strong> {new Date(employee.workAuthorization.startDate).toLocaleDateString()}
                </Typography>
              )}
              {employee.workAuthorization?.endDate && (
                <Typography variant="body1">
                  <strong>End Date:</strong> {new Date(employee.workAuthorization.endDate).toLocaleDateString()}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Row 2: Phone Number and Email */}
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 4 }}>
            {/* Phone Number */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Phone color="primary" />
                <Typography variant="h6" color="primary">
                  Phone Number
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Cell:</strong> {employee.phoneNumbers?.cell || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Work:</strong> {employee.phoneNumbers?.work || 'N/A'}
              </Typography>
            </Box>

            {/* Email */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Email color="primary" />
                <Typography variant="h6" color="primary">
                  Email
                </Typography>
              </Box>
              <Link href={`mailto:${employee.email}`} underline="hover">
                <Typography variant="body1" color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {employee.email}
                </Typography>
              </Link>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default EmployeeDetail; 