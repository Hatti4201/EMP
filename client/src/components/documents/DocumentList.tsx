import React, { useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Typography,
  Paper,
} from '@mui/material';
import {
  Visibility,
  Download,
  PictureAsPdf,
  Image,
  InsertDriveFile,
} from '@mui/icons-material';
import DocumentViewer from './DocumentViewer';
import type { Document } from '../../types';

interface DocumentListProps {
  documents: Document[];
  title?: string;
  onDownload?: (document: Document) => void;
  showStatus?: boolean;
  emptyMessage?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  title,
  onDownload,
  showStatus = true,
  emptyMessage = 'No documents uploaded yet.',
}) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  const getFileIcon = (document: Document) => {
    if (document.name.toLowerCase().includes('.pdf') || document.mimeType === 'application/pdf') {
      return <PictureAsPdf color="error" />;
    }
    if (document.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return <Image color="primary" />;
    }
    return <InsertDriveFile />;
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

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewerOpen(true);
  };

  const handleDownload = (document: Document) => {
    if (onDownload) {
      onDownload(document);
    } else {
      // Default download behavior
      window.open(document.url, '_blank');
    }
  };

  if (documents.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="textSecondary">
          {emptyMessage}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {title && (
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
      )}
      
      <Paper>
        <List>
          {documents.map((document, index) => (
            <ListItem key={document._id || index} divider={index < documents.length - 1}>
              <ListItemIcon>
                {getFileIcon(document)}
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1">{document.name}</Typography>
                    {showStatus && (
                      <Chip
                        label={document.status}
                        color={getStatusColor(document.status) as any}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Uploaded: {new Date(document.uploadDate).toLocaleDateString()}
                    </Typography>
                    {document.feedback && (
                      <Typography
                        variant="body2"
                        color={document.status === 'rejected' ? 'error' : 'textSecondary'}
                        sx={{ mt: 0.5 }}
                      >
                        Feedback: {document.feedback}
                      </Typography>
                    )}
                  </Box>
                }
              />
              
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleViewDocument(document)}
                  sx={{ mr: 1 }}
                >
                  <Visibility />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDownload(document)}
                >
                  <Download />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
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
          onDownload={() => handleDownload(selectedDocument)}
          showStatus={showStatus}
        />
      )}
    </Box>
  );
};

export default DocumentList; 