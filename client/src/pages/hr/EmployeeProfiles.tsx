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

  Link,
  TablePagination,
} from '@mui/material';
import {
  Search,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchAllEmployees } from '../../store/slices/hrSlice';

// Import reusable components
import SearchBar from '../../components/search/SearchBar';
import type { Employee } from '../../types';

const EmployeeProfiles: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { employees, loading, error } = useAppSelector((state) => state.hr);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchAllEmployees());
  }, [dispatch]);

  useEffect(() => {
    // Use debouncing for real-time search on every key press
    const debounceTimer = setTimeout(() => {
      if (searchTerm.trim()) {
        console.log('🔍 Searching employees with term:', searchTerm);
        dispatch(fetchAllEmployees(searchTerm)); // Pass search term to fetchAllEmployees
      } else {
        console.log('🔍 Fetching all employees (no search term)');
        dispatch(fetchAllEmployees());
      }
    }, 300); // 300ms debounce for real-time search

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, dispatch]);



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
  const sortedEmployees = [...employees].sort((a, b) => {
    const aLastName = a.lastName || '';
    const bLastName = b.lastName || '';
    return aLastName.localeCompare(bLastName);
  });

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
                <TableCell>Work Authorization Title</TableCell>
                <TableCell>Phone Number</TableCell>
                <TableCell>Email</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEmployees.map((employee) => (
                <TableRow key={employee._id || employee.userId} hover>
                  <TableCell>
                    <Box>
                      <Typography 
                        variant="body1" 
                        fontWeight="medium" 
                        color="primary"
                        sx={{ 
                          cursor: 'pointer', 
                          textDecoration: 'underline',
                          '&:hover': {
                            textDecoration: 'none'
                          }
                        }}
                        onClick={() => {
                          const employeeId = employee._id || employee.userId;
                          if (!employeeId) {
                            alert('Error: Employee ID not found. Cannot open profile.');
                            return;
                          }
                          const url = `/hr/employee-profiles/${employeeId}`;
                          navigate(url);
                        }}
                      >
                        {employee.lastName || 'N/A'}, {employee.firstName || 'N/A'}
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


    </Box>
  );
};

export default EmployeeProfiles; 