import React, { useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  LinearProgress,
  Chip,
  Divider,
  ListItemIcon,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  People,
  Schedule,
  TrendingUp,
  Visibility,
  Person,
  Description,
  Add,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchDashboardStats, fetchPendingApplications, fetchAllEmployees } from '../../store/slices/hrSlice';

// Import reusable components
import StatusChip from '../../components/common/StatusChip';

const HRHome: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { dashboardStats, pendingApplications, employees, loading, error } = useAppSelector((state) => state.hr);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchPendingApplications());
    dispatch(fetchAllEmployees());
  }, [dispatch]);

  return (
    <Box sx={{ 
      width: '100%',
      minHeight: '100vh',
      padding: { xs: 2, sm: 3, md: 4 },
      backgroundColor: '#f5f5f5'
    }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        HR Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ width: '100%', mb: 3 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Statistics Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr 1fr' }, 
        gap: 3, 
        mb: 4 
      }}>
        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
          <Person sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
          <Typography variant="h3" color="primary">
            {dashboardStats?.totalEmployees || 0}
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Total Employees
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
          <Assignment sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
          <Typography variant="h3" color="warning.main">
            {dashboardStats?.pendingApplications || 0}
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Pending Applications
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
          <Description sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
          <Typography variant="h3" color="info.main">
            {dashboardStats?.pendingVisaDocuments || 0}
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Pending Visa Docs
          </Typography>
        </Paper>

        <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2 }}>
          <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
          <Typography variant="h3" color="success.main">
            {dashboardStats?.approvedApplications || 0}
          </Typography>
          <Typography variant="h6" color="textSecondary">
            Approved Applications
          </Typography>
        </Paper>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, 
        gap: 3, 
        mb: 4 
      }}>
        {/* Recent Activities */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activities
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <Person />
              </ListItemIcon>
              <ListItemText
                primary="New employee registered"
                secondary="2 hours ago"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Assignment />
              </ListItemIcon>
              <ListItemText
                primary="Onboarding application submitted"
                secondary="5 hours ago"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Description />
              </ListItemIcon>
              <ListItemText
                primary="Visa document approved"
                secondary="1 day ago"
              />
            </ListItem>
          </List>
        </Paper>

        {/* Quick Actions */}
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              fullWidth
              size="large"
              onClick={() => navigate('/hr/hiring-management')}
            >
              Generate Registration Token
            </Button>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              fullWidth
              size="large"
              onClick={() => navigate('/hr/employee-profiles')}
            >
              View All Employees
            </Button>
            <Button
              variant="outlined"
              startIcon={<Assignment />}
              fullWidth
              size="large"
              onClick={() => navigate('/hr/hiring-management')}
            >
              Review Applications
            </Button>
            <Button
              variant="outlined"
              startIcon={<Description />}
              fullWidth
              size="large"
              onClick={() => navigate('/hr/visa-management')}
            >
              Manage Visa Documents
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Recent Applications */}
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Recent Pending Applications
        </Typography>
        {pendingApplications.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No pending applications at the moment.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Submitted Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingApplications.slice(0, 5).map((application) => (
                  <TableRow key={application._id}>
                    <TableCell>{application.employeeId}</TableCell>
                    <TableCell>
                      {new Date(application.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={application.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate('/hr/hiring-management')}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default HRHome; 