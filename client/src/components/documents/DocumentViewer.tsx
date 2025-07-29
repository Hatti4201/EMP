import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Close,
  Download,
  PictureAsPdf,
  Image,
  InsertDriveFile,
} from '@mui/icons-material';
import type { Document } from '../../types';

interface DocumentViewerProps {
  document: Document;
  open: boolean;
  onClose: () => void;
  onDownload?: () => void;
  showStatus?: boolean;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  open,
  onClose,
  onDownload,
  showStatus = true,
}) => {
  const [imageError, setImageError] = useState(false);

  const getFileIcon = () => {
    if (document.name.toLowerCase().includes('.pdf') || document.mimeType === 'application/pdf') {
      return <PictureAsPdf sx={{ fontSize: 64, color: '#d32f2f' }} />;
    }
    if (document.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <Image sx={{ fontSize: 64, color: '#1976d2' }} />;
    }
    return <InsertDriveFile sx={{ fontSize: 64, color: '#666' }} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const isImage = document.name.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = document.name.toLowerCase().includes('.pdf') || document.mimeType === 'application/pdf';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{document.name}</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          {/* Document Status */}
          {showStatus && (
            <Box display="flex" gap={1} alignItems="center">
              <Chip
                label={document.status}
                color={getStatusColor(document.status) as any}
                variant="outlined"
              />
              <Typography variant="body2" color="textSecondary">
                Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
              </Typography>
            </Box>
          )}

          {/* Document Preview */}
          <Box
            sx={{
              width: '100%',
              minHeight: 400,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              border: '1px solid #e0e0e0',
              borderRadius: 2,
              backgroundColor: '#f9f9f9',
            }}
          >
            {isImage && !imageError ? (
              <img
                src={document.url}
                alt={document.name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain',
                }}
                onError={() => setImageError(true)}
              />
            ) : isPDF ? (
              <Box textAlign="center">
                {getFileIcon()}
                <Typography variant="h6" sx={{ mt: 2 }}>
                  PDF Document
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Click download to view the PDF
                </Typography>
              </Box>
            ) : (
              <Box textAlign="center">
                {getFileIcon()}
                <Typography variant="h6" sx={{ mt: 2 }}>
                  {document.name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Preview not available for this file type
                </Typography>
              </Box>
            )}
          </Box>

          {/* Feedback Section */}
          {document.feedback && (
            <Box
              sx={{
                width: '100%',
                p: 2,
                backgroundColor: document.status === 'rejected' ? '#ffebee' : '#e8f5e8',
                borderRadius: 2,
                border: `1px solid ${document.status === 'rejected' ? '#ffcdd2' : '#c8e6c8'}`,
              }}
            >
              <Typography variant="subtitle2" gutterBottom>
                Feedback:
              </Typography>
              <Typography variant="body2">{document.feedback}</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        {onDownload && (
          <Button
            startIcon={<Download />}
            onClick={onDownload}
            variant="outlined"
          >
            Download
          </Button>
        )}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentViewer; 