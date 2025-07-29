import React from 'react';
import { Chip, ChipProps } from '@mui/material';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'in-progress' | 'never-submitted';
}

const StatusChip: React.FC<StatusChipProps> = ({ status, ...chipProps }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return { color: 'success' as const, label: status.charAt(0).toUpperCase() + status.slice(1) };
      case 'rejected':
        return { color: 'error' as const, label: 'Rejected' };
      case 'pending':
        return { color: 'warning' as const, label: 'Pending' };
      case 'in-progress':
        return { color: 'info' as const, label: 'In Progress' };
      case 'never-submitted':
        return { color: 'default' as const, label: 'Not Submitted' };
      default:
        return { color: 'default' as const, label: status };
    }
  };

  const { color, label } = getStatusConfig(status);

  return (
    <Chip
      {...chipProps}
      label={label}
      color={color}
      variant="outlined"
      size="small"
    />
  );
};

export default StatusChip; 