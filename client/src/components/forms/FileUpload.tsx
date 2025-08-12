import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  PictureAsPdf,
  Image,
  InsertDriveFile,
  CheckCircle,
} from '@mui/icons-material';
import { Controller, useFormContext } from 'react-hook-form';
import { useAppDispatch } from '../../store';
import { uploadFile } from '../../store/slices/employeeSlice';

interface FileUploadProps {
  name: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  rules?: object;
}

const FileUpload: React.FC<FileUploadProps> = ({
  name,
  label,
  accept = "*/*",
  multiple = false,
  maxSize = 10,
  rules,
}) => {
  const { control, formState: { errors } } = useFormContext();
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{name: string, url: string} | null>(null);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image />;
    if (file.type === 'application/pdf') return <PictureAsPdf />;
    return <InsertDriveFile />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File) => {
    if (maxSize && file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }
    return true;
  };

  const handleFileUpload = async (file: File, onChange: (value: any) => void) => {
    const validation = validateFile(file);
    if (validation !== true) {
      alert(validation);
      return;
    }

    setUploading(true);
    try {
      console.log('🔼 Uploading file:', file.name);
      const result = await dispatch(uploadFile({ file, type: 'onboarding-document' })).unwrap();
      console.log('✅ File uploaded successfully:', result);
      
      const uploadedData = {
        name: file.name,
        url: result.url
      };
      
      setUploadedFile(uploadedData);
      // Save the URL to the form field instead of the File object
      onChange(result.url);
    } catch (error) {
      console.error('❌ File upload failed:', error);
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field: { onChange, value } }) => (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {label}
          </Typography>
          
          <Paper
            sx={{
              p: 3,
              border: dragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
              backgroundColor: dragOver ? '#f5f5f5' : 'transparent',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const files = Array.from(e.dataTransfer.files);
              if (files.length > 0) {
                const file = files[0];
                handleFileUpload(file, onChange);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple={multiple}
              style={{ display: 'none' }}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  const file = files[0];
                  handleFileUpload(file, onChange);
                }
              }}
            />
            
            <CloudUpload sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drop files here or click to upload
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Max file size: {maxSize}MB
            </Typography>
          </Paper>

          {/* Display upload status */}
          {uploading && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={20} sx={{ mr: 2 }} />
              <Typography variant="body2">Uploading file...</Typography>
            </Box>
          )}

          {/* Display uploaded file */}
          {uploadedFile && !uploading && (
            <Box sx={{ mt: 2 }}>
              <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: '#f5f5f5' }}>
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1">{uploadedFile.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Uploaded successfully
                  </Typography>
                </Box>
                <IconButton 
                  onClick={() => {
                    setUploadedFile(null);
                    onChange(null);
                  }}
                >
                  <Delete />
                </IconButton>
              </Paper>
            </Box>
          )}

          {errors[name] && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {errors[name]?.message as string}
            </Alert>
          )}
        </Box>
      )}
    />
  );
};

export default FileUpload; 