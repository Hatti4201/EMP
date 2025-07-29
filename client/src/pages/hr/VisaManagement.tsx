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
  Chip,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore,
  Visibility,
  Download,
  CheckCircle,
  Cancel,
  Send,
  Schedule,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  fetchAllEmployees, 
  reviewVisaDocument, 
  sendNotificationEmail 
} from '../../store/slices/hrSlice';

// Import reusable components
import SearchBar from '../../components/search/SearchBar';
import StatusChip from '../../components/common/StatusChip';
import DocumentViewer from '../../components/documents/DocumentViewer';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import type { Employee, Document } from '../../types';

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
      id={`visa-tabpanel-${index}`}
      aria-labelledby={`visa-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const VisaManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { employees, loading, error } = useAppSelector((state) => state.hr);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');

  useEffect(() => {
    dispatch(fetchAllEmployees());
  }, [dispatch]);

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee =>
    searchTerm.trim() === '' ||
    employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.preferredName && employee.preferredName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filter employees with OPT visa status for In Progress tab
  const inProgressEmployees = filteredEmployees.filter(employee => 
    employee.workAuthorization?.visaType === 'f1-cpt-opt' &&
    employee.onboardingStatus === 'approved'
  );

  // All visa status employees for All tab
  const allVisaEmployees = filteredEmployees.filter(employee => 
    employee.workAuthorization?.visaType === 'f1-cpt-opt'
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const handleReviewDocument = (employeeId: string, documentType: string, document: Document, action: 'approved' | 'rejected') => {
    setSelectedEmployeeId(employeeId);
    setSelectedDocumentType(documentType);
    setSelectedDocument(document);
    setActionType(action);
    
    if (action === 'rejected') {
      setReviewDialogOpen(true);
    } else {
      setConfirmDialogOpen(true);
    }
  };

  const handleConfirmReview = async () => {
    if (!selectedEmployeeId || !selectedDocumentType || !actionType) return;

    try {
      await dispatch(reviewVisaDocument({
        employeeId: selectedEmployeeId,
        documentType: selectedDocumentType,
        status: actionType,
        feedback: actionType === 'rejected' ? feedback : undefined,
      })).unwrap();

      // Refresh employee data
      dispatch(fetchAllEmployees());
      
      // Close dialogs and reset state
      setReviewDialogOpen(false);
      setConfirmDialogOpen(false);
      setFeedback('');
      setActionType(null);
      setSelectedEmployeeId('');
      setSelectedDocumentType('');
    } catch (error) {
      console.error('Failed to review document:', error);
    }
  };

  const handleSendNotification = async (employeeId: string, type: string) => {
    try {
      await dispatch(sendNotificationEmail({ employeeId, type })).unwrap();
      // Show success message or toast
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const getEmployeeVisaDocuments = (employee: Employee) => {
    // This would normally come from a visa status object
    // For now, we'll simulate the document structure
    return {
      optReceipt: employee.documents?.find(doc => doc.type === 'opt-receipt'),
      optEad: employee.documents?.find(doc => doc.type === 'opt-ead'),
      i983: employee.documents?.find(doc => doc.type === 'i983'),
      i20: employee.documents?.find(doc => doc.type === 'i20'),
    };
  };

  const getNextStep = (employee: Employee) => {
    const docs = getEmployeeVisaDocuments(employee);
    
    if (!docs.optReceipt) return 'Submit onboarding application';
    if (docs.optReceipt.status === 'pending') return 'Wait for HR approval - OPT Receipt';
    if (docs.optReceipt.status === 'rejected') return 'Resubmit OPT Receipt';
    
    if (!docs.optEad) return 'Upload OPT EAD';
    if (docs.optEad.status === 'pending') return 'Wait for HR approval - OPT EAD';
    if (docs.optEad.status === 'rejected') return 'Resubmit OPT EAD';
    
    if (!docs.i983) return 'Upload I-983 Form';
    if (docs.i983.status === 'pending') return 'Wait for HR approval - I-983';
    if (docs.i983.status === 'rejected') return 'Resubmit I-983';
    
    if (!docs.i20) return 'Upload I-20';
    if (docs.i20.status === 'pending') return 'Wait for HR approval - I-20';
    if (docs.i20.status === 'rejected') return 'Resubmit I-20';
    
    return 'All documents approved';
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return 'N/A';
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} days` : 'Expired';
  };

  const renderInProgressTab = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Employees with Pending Visa Documents
      </Typography>
      
      {inProgressEmployees.length === 0 ? (
        <Alert severity="info">
          No employees with pending visa documents.
        </Alert>
      ) : (
        inProgressEmployees.map((employee) => {
          const docs = getEmployeeVisaDocuments(employee);
          const nextStep = getNextStep(employee);
          const daysRemaining = getDaysRemaining(employee.workAuthorization?.endDate);
          
          return (
            <Accordion key={employee._id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {employee.firstName} {employee.lastName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Next Step: {nextStep}
                    </Typography>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2">
                      {employee.workAuthorization?.visaTitle}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {daysRemaining} remaining
                    </Typography>
                  </Box>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Document Status & Actions
                  </Typography>
                  
                  {/* OPT Receipt */}
                  {docs.optReceipt && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6">OPT Receipt</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {docs.optReceipt.name}
                          </Typography>
                          <StatusChip status={docs.optReceipt.status} sx={{ mt: 1 }} />
                        </Box>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleViewDocument(docs.optReceipt!)}
                          >
                            Preview
                          </Button>
                          {docs.optReceipt.status === 'pending' && (
                            <>
                              <Button
                                size="small"
                                startIcon={<CheckCircle />}
                                color="success"
                                                                 onClick={() => handleReviewDocument(employee._id, 'opt-receipt', docs.optReceipt!, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Cancel />}
                                color="error"
                                                                 onClick={() => handleReviewDocument(employee._id, 'opt-receipt', docs.optReceipt!, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  )}

                  {/* Similar structure for other documents */}
                  {docs.optEad && (
                    <Paper sx={{ p: 2, mb: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="h6">OPT EAD</Typography>
                          <Typography variant="body2" color="textSecondary">
                            {docs.optEad.name}
                          </Typography>
                          <StatusChip status={docs.optEad.status} sx={{ mt: 1 }} />
                        </Box>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            startIcon={<Visibility />}
                            onClick={() => handleViewDocument(docs.optEad!)}
                          >
                            Preview
                          </Button>
                          {docs.optEad.status === 'pending' && (
                            <>
                              <Button
                                size="small"
                                startIcon={<CheckCircle />}
                                color="success"
                                                                 onClick={() => handleReviewDocument(employee._id, 'opt-ead', docs.optEad!, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Cancel />}
                                color="error"
                                                                 onClick={() => handleReviewDocument(employee._id, 'opt-ead', docs.optEad!, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  )}

                  {/* Send Notification Button */}
                  {nextStep.includes('Upload') && (
                    <Button
                      variant="outlined"
                      startIcon={<Send />}
                      onClick={() => handleSendNotification(employee._id, 'next-step')}
                      sx={{ mt: 2 }}
                    >
                      Send Notification Email
                    </Button>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          );
        })
      )}
    </Box>
  );

  const renderAllTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          All Visa Status Employees ({allVisaEmployees.length})
        </Typography>
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          onClear={() => setSearchTerm('')}
          placeholder="Search employees..."
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Work Authorization</TableCell>
              <TableCell>Days Remaining</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Documents</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {allVisaEmployees.map((employee) => {
              const docs = getEmployeeVisaDocuments(employee);
                             const approvedDocs = Object.values(docs).filter((doc): doc is Document => doc !== undefined && doc.status === 'approved');
              
              return (
                <TableRow key={employee._id}>
                  <TableCell>
                    <Typography variant="body1">
                      {employee.firstName} {employee.lastName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {employee.email}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {employee.workAuthorization?.visaTitle}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {employee.workAuthorization?.startDate} - {employee.workAuthorization?.endDate}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getDaysRemaining(employee.workAuthorization?.endDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={getNextStep(employee) === 'All documents approved' ? 'completed' : 'in-progress'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {approvedDocs.length}/4 approved
                    </Typography>
                    <Box display="flex" gap={0.5} mt={0.5}>
                      {approvedDocs.map((doc, index) => (
                        <Button
                          key={index}
                          size="small"
                          startIcon={<Download />}
                          onClick={() => handleViewDocument(doc)}
                        >
                          {doc.type}
                        </Button>
                      ))}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Visa Status Management
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
          <Tab label="In Progress" />
          <Tab label="All" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          {renderInProgressTab()}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderAllTab()}
        </TabPanel>
      </Paper>

      {/* Document Viewer Dialog */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          open={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDocument(null);
          }}
          onDownload={() => window.open(selectedDocument.url, '_blank')}
          showStatus={true}
        />
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Document</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Please provide feedback for why this document is being rejected:
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
            Reject Document
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmReview}
        title="Approve Document"
        message="Are you sure you want to approve this document?"
        confirmText="Approve"
        confirmColor="success"
      />
    </Box>
  );
};

export default VisaManagement; 