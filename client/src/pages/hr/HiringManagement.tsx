import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  Chip,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add,
  Send,
  Visibility,
  CheckCircle,
  Cancel,
  Email,
  Schedule,
  Person,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  generateRegistrationToken, 
  fetchRegistrationTokens,
  fetchPendingApplications,
  reviewOnboardingApplication,
} from '../../store/slices/hrSlice';

// Import reusable components
import StatusChip from '../../components/common/StatusChip';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import type { OnboardingApplication, RegistrationToken } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hiring-tabpanel-${index}`}
      aria-labelledby={`hiring-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const tokenSchema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  name: yup.string().optional(),
});

interface TokenForm {
  email: string;
  name?: string;
}

const HiringManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { registrationTokens, pendingApplications, loading, error } = useAppSelector((state) => state.hr);
  const [activeTab, setActiveTab] = useState(0);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<OnboardingApplication | null>(null);
  const [feedback, setFeedback] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(tokenSchema),
    defaultValues: {
      email: '',
      name: '',
    },
  });

  useEffect(() => {
    dispatch(fetchRegistrationTokens());
    dispatch(fetchPendingApplications());
  }, [dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const onSubmitToken = async (data: TokenForm) => {
    try {
      await dispatch(generateRegistrationToken(data)).unwrap();
      setTokenDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Failed to generate token:', error);
    }
  };

  const handleReviewApplication = (application: OnboardingApplication, action: 'approved' | 'rejected') => {
    setSelectedApplication(application);
    setActionType(action);
    
    if (action === 'rejected') {
      setReviewDialogOpen(true);
    } else {
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirmReview = async () => {
    if (!selectedApplication || !actionType) return;

    try {
      await dispatch(reviewOnboardingApplication({
        applicationId: selectedApplication._id,
        status: actionType,
        feedback: actionType === 'rejected' ? feedback : undefined,
      })).unwrap();

      // Refresh applications
      dispatch(fetchPendingApplications());
      
      // Close dialogs and reset state
      setReviewDialogOpen(false);
      setConfirmDialogOpen(false);
      setFeedback('');
      setActionType(null);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Failed to review application:', error);
    }
  };

  const getTokenStatus = (token: RegistrationToken) => {
    const now = new Date();
    const expires = new Date(token.expiresAt);
    
    if (token.used) return 'used';
    if (now > expires) return 'expired';
    return 'active';
  };

  const getTokenStatusColor = (status: string) => {
    switch (status) {
      case 'used':
        return 'success';
      case 'expired':
        return 'error';
      case 'active':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Group applications by status
  const pendingApps = pendingApplications.filter(app => app.status === 'pending');
  const rejectedApps = pendingApplications.filter(app => app.status === 'rejected');
  const approvedApps = pendingApplications.filter(app => app.status === 'approved');

  const renderTokenManagement = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Registration Token Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setTokenDialogOpen(true)}
        >
          Generate Token & Send Email
        </Button>
      </Box>

      {/* Token History */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Token History
          </Typography>
          {registrationTokens.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No registration tokens generated yet.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Registration Link</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Expires</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registrationTokens.map((token) => (
                    <TableRow key={token._id}>
                      <TableCell>{token.email}</TableCell>
                      <TableCell>{token.name || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.75rem' }}>
                          {`${window.location.origin}/register?token=${token.token}`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getTokenStatus(token)} 
                          color={getTokenStatusColor(getTokenStatus(token)) as any}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(token.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(token.expiresAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );

  const renderApplicationSection = (title: string, applications: OnboardingApplication[], showActions: boolean = false) => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} ({applications.length})
        </Typography>
        {applications.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No {title.toLowerCase()} applications.
          </Typography>
        ) : (
          <List>
            {applications.map((application, index) => (
              <React.Fragment key={application._id}>
                <ListItem>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Person fontSize="small" />
                        <Typography variant="body1">
                          Employee ID: {application.employeeId}
                        </Typography>
                        <StatusChip status={application.status} />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                        </Typography>
                        {application.feedback && (
                          <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                            Feedback: {application.feedback}
                          </Typography>
                        )}
                        {application.reviewedAt && (
                          <Typography variant="body2" color="textSecondary">
                            Reviewed: {new Date(application.reviewedAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => {
                        // Open application in new tab/dialog
                        console.log('View application:', application._id);
                      }}
                      sx={{ mr: 1 }}
                    >
                      View Application
                    </Button>
                    {showActions && (
                      <>
                        <Button
                          size="small"
                          startIcon={<CheckCircle />}
                          color="success"
                          onClick={() => handleReviewApplication(application, 'approved')}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Cancel />}
                          color="error"
                          onClick={() => handleReviewApplication(application, 'rejected')}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                {index < applications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );

  const renderApplicationReview = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Onboarding Application Review
      </Typography>
      
      {renderApplicationSection('Pending Applications', pendingApps, true)}
      {renderApplicationSection('Rejected Applications', rejectedApps)}
      {renderApplicationSection('Approved Applications', approvedApps)}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Hiring Management
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

      <Paper sx={{ p: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Registration Tokens" />
          <Tab label="Application Review" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {renderTokenManagement()}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderApplicationReview()}
        </TabPanel>
      </Paper>

      {/* Generate Token Dialog */}
      <Dialog open={tokenDialogOpen} onClose={() => setTokenDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Registration Token</DialogTitle>
        <form onSubmit={handleSubmit(onSubmitToken)}>
          <DialogContent>
            <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
              Generate a registration token and send it to a new employee's email address.
              The token will be valid for 3 hours.
            </Typography>
            
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Employee Email *"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Employee Name (Optional)"
                  error={!!errors.name}
                  helperText={errors.name?.message}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTokenDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit"
              variant="contained"
              startIcon={<Send />}
              disabled={loading}
            >
              Generate & Send Email
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Application</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Please provide feedback for why this application is being rejected:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Enter feedback for the employee..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmReview} 
            color="error" 
            variant="contained"
            disabled={!feedback.trim()}
          >
            Reject Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmReview}
        title="Approve Application"
        message="Are you sure you want to approve this onboarding application?"
        confirmText="Approve"
        confirmColor="success"
      />
    </Box>
  );
};

export default HiringManagement; 