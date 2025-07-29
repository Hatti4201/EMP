import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  PictureAsPdf,
  Image,
  InsertDriveFile,
} from '@mui/icons-material';
import { Controller, useFormContext } from 'react-hook-form';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

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
                const validation = validateFile(file);
                if (validation === true) {
                  onChange(multiple ? files : file);
                }
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
                  const validation = validateFile(file);
                  if (validation === true) {
                    onChange(multiple ? files : file);
                  }
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

          {/* Display selected files */}
          {value && (
            <Box sx={{ mt: 2 }}>
              {Array.isArray(value) ? (
                value.map((file: File, index: number) => (
                  <Paper key={index} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center' }}>
                    {getFileIcon(file)}
                    <Box sx={{ ml: 2, flexGrow: 1 }}>
                      <Typography variant="body1">{file.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {formatFileSize(file.size)}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => {
                        const newFiles = value.filter((_: File, i: number) => i !== index);
                        onChange(newFiles.length > 0 ? newFiles : null);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Paper>
                ))
              ) : (
                <Paper sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  {getFileIcon(value)}
                  <Box sx={{ ml: 2, flexGrow: 1 }}>
                    <Typography variant="body1">{value.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {formatFileSize(value.size)}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => onChange(null)}>
                    <Delete />
                  </IconButton>
                </Paper>
              )}
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