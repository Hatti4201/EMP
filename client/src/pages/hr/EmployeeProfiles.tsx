import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
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
  Chip,
  Link,
  TablePagination,
} from '@mui/material';
import {
  Search,
  Visibility,
  GetApp,
  Person,
  Phone,
  Email,
  Work,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchAllEmployees, searchEmployees } from '../../store/slices/hrSlice';

// Import reusable components
import SearchBar from '../../components/search/SearchBar';
import StatusChip from '../../components/common/StatusChip';
import DocumentList from '../../components/documents/DocumentList';
import type { Employee } from '../../types';

const EmployeeProfiles: React.FC = () => {
  const dispatch = useAppDispatch();
  const { employees, loading, error } = useAppSelector((state) => state.hr);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchAllEmployees());
  }, [dispatch]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const debounceTimer = setTimeout(() => {
        dispatch(searchEmployees(searchTerm));
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      dispatch(fetchAllEmployees());
    }
  }, [searchTerm, dispatch]);

  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployee(employee);
    setProfileDialogOpen(true);
  };

  const handleCloseProfile = () => {
    setSelectedEmployee(null);
    setProfileDialogOpen(false);
  };

  const handleSearchClear = () => {
    setSearchTerm('');
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Sort employees alphabetically by last name
  const sortedEmployees = [...employees].sort((a, b) => 
    a.lastName.localeCompare(b.lastName)
  );

  const paginatedEmployees = sortedEmployees.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderSearchResults = () => {
    if (searchTerm.trim() && employees.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No employees found matching "{searchTerm}". Try searching by first name, last name, or preferred name.
        </Alert>
      );
    }

    if (searchTerm.trim() && employees.length === 1) {
      return (
        <Alert severity="success" sx={{ mt: 2 }}>
          Found 1 employee matching "{searchTerm}".
        </Alert>
      );
    }

    if (searchTerm.trim() && employees.length > 1) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Found {employees.length} employees matching "{searchTerm}".
        </Alert>
      );
    }

    return null;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Employee Profiles
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        {/* Search and Summary */}
        <Box sx={{ mb: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Employee Directory ({sortedEmployees.length} total)
            </Typography>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={handleSearchClear}
              placeholder="Search by first name, last name, or preferred name..."
            />
          </Box>

          {renderSearchResults()}
        </Box>

        {loading && (
          <Box sx={{ width: '100%', mb: 3 }}>
            <LinearProgress />
          </Box>
        )}

        {/* Employee Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>SSN</TableCell>
                <TableCell>Work Authorization</TableCell>
                <TableCell>Phone Number</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.map((employee) => (
                <TableRow key={employee._id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {employee.lastName}, {employee.firstName}
                        {employee.middleName && ` ${employee.middleName}`}
                      </Typography>
                      {employee.preferredName && (
                        <Typography variant="body2" color="textSecondary">
                          Preferred: {employee.preferredName}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {employee.ssn ? `***-**-${employee.ssn.slice(-4)}` : 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {employee.workAuthorization?.visaTitle || 'N/A'}
                      </Typography>
                      {employee.workAuthorization?.endDate && (
                        <Typography variant="caption" color="textSecondary">
                          Expires: {new Date(employee.workAuthorization.endDate).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {employee.phoneNumbers?.cell || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Link href={`mailto:${employee.email}`} underline="hover">
                      <Typography variant="body2" color="primary">
                        {employee.email}
                      </Typography>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={employee.onboardingStatus} />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => handleViewProfile(employee)}
                    >
                      View Profile
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={sortedEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Employee Profile Dialog */}
      <Dialog
        open={profileDialogOpen}
        onClose={handleCloseProfile}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '80vh' }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Person />
            <Typography variant="h6">
              Employee Profile: {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {selectedEmployee && (
            <Box>
              {/* Personal Information */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Personal Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2">Full Name</Typography>
                    <Typography variant="body2">
                      {selectedEmployee.firstName} {selectedEmployee.middleName} {selectedEmployee.lastName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Preferred Name</Typography>
                    <Typography variant="body2">
                      {selectedEmployee.preferredName || 'Not specified'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Email</Typography>
                    <Link href={`mailto:${selectedEmployee.email}`} underline="hover">
                      <Typography variant="body2" color="primary">
                        {selectedEmployee.email}
                      </Typography>
                    </Link>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">SSN</Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {selectedEmployee.ssn ? `***-**-${selectedEmployee.ssn.slice(-4)}` : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Date of Birth</Typography>
                    <Typography variant="body2">
                      {selectedEmployee.dateOfBirth ? 
                        new Date(selectedEmployee.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Gender</Typography>
                    <Typography variant="body2">
                      {selectedEmployee.gender === 'no-answer' ? 'Prefer not to answer' : 
                       selectedEmployee.gender?.charAt(0).toUpperCase() + selectedEmployee.gender?.slice(1) || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Address */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Address
                </Typography>
                {selectedEmployee.address ? (
                  <Typography variant="body2">
                    {selectedEmployee.address.building} {selectedEmployee.address.street}<br />
                    {selectedEmployee.address.city}, {selectedEmployee.address.state} {selectedEmployee.address.zip}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No address information available
                  </Typography>
                )}
              </Paper>

              {/* Contact Information */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Contact Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2">Cell Phone</Typography>
                    <Typography variant="body2">
                      {selectedEmployee.phoneNumbers?.cell || 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Work Phone</Typography>
                    <Typography variant="body2">
                      {selectedEmployee.phoneNumbers?.work || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Work Authorization */}
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Work Authorization
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2">Status</Typography>
                    <Typography variant="body2">
                      {selectedEmployee.workAuthorization?.isPermanentResident ? 
                        `${selectedEmployee.workAuthorization.citizenshipStatus?.toUpperCase()}` : 
                        'Non-permanent resident'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2">Visa Type</Typography>
                    <Typography variant="body2">
                      {selectedEmployee.workAuthorization?.visaTitle || 'N/A'}
                    </Typography>
                  </Box>
                  {selectedEmployee.workAuthorization?.startDate && (
                    <Box>
                      <Typography variant="subtitle2">Start Date</Typography>
                      <Typography variant="body2">
                        {new Date(selectedEmployee.workAuthorization.startDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                  {selectedEmployee.workAuthorization?.endDate && (
                    <Box>
                      <Typography variant="subtitle2">End Date</Typography>
                      <Typography variant="body2">
                        {new Date(selectedEmployee.workAuthorization.endDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>

              {/* Emergency Contacts */}
              {selectedEmployee.emergencyContacts && selectedEmployee.emergencyContacts.length > 0 && (
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Emergency Contacts
                  </Typography>
                  {selectedEmployee.emergencyContacts.map((contact, index) => (
                    <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < selectedEmployee.emergencyContacts!.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                      <Typography variant="subtitle2">
                        Contact {index + 1}: {contact.firstName} {contact.lastName}
                      </Typography>
                      <Typography variant="body2">
                        Phone: {contact.phone}<br />
                        Email: {contact.email}<br />
                        Relationship: {contact.relationship}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              )}

              {/* Documents */}
              {selectedEmployee.documents && selectedEmployee.documents.length > 0 && (
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Documents
                  </Typography>
                  <DocumentList
                    documents={selectedEmployee.documents}
                    showStatus={true}
                    emptyMessage="No documents uploaded."
                  />
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseProfile}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeProfiles; 