import React, { useState, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Stack,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Work as WorkIcon
} from '@mui/icons-material';

interface FileUploadAreaProps {
  onFilesUploaded: (resumeFile: File | null, jobDescFile: File | null) => void;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFilesUploaded }) => {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescFile, setJobDescFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const jobDescInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
      onFilesUploaded(e.target.files[0], jobDescFile);
    }
  };

  const handleJobDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setJobDescFile(e.target.files[0]);
      onFilesUploaded(resumeFile, e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Determine file type based on name or content
      const file = e.dataTransfer.files[0];
      const fileName = file.name.toLowerCase();
      
      if (fileName.includes('resume') || fileName.includes('cv')) {
        setResumeFile(file);
        onFilesUploaded(file, jobDescFile);
      } else {
        setJobDescFile(file);
        onFilesUploaded(resumeFile, file);
      }
    }
  };

  const onButtonClick = (type: 'resume' | 'jobDesc') => {
    if (type === 'resume' && inputRef.current) {
      inputRef.current.click();
    } else if (type === 'jobDesc' && jobDescInputRef.current) {
      jobDescInputRef.current.click();
    }
  };

  const removeFile = (type: 'resume' | 'jobDesc') => {
    if (type === 'resume') {
      setResumeFile(null);
      onFilesUploaded(null, jobDescFile);
    } else {
      setJobDescFile(null);
      onFilesUploaded(resumeFile, null);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Upload Files
      </Typography>
      <Typography color="text.secondary" paragraph>
        Upload your resume and job description to get AI-powered tailoring suggestions.
      </Typography>
      
      <Stack spacing={3}>
        {/* Resume Upload Section */}
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: dragActive ? 'primary.main' : 'grey.400',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            bgcolor: dragActive ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleResumeChange}
            style={{ display: 'none' }}
          />
          
          <input
            ref={jobDescInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleJobDescChange}
            style={{ display: 'none' }}
          />
          
          <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" component="div" gutterBottom>
            Drag & Drop Files
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Supports PDF, DOCX (up to 5MB)
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<DescriptionIcon />}
              onClick={() => onButtonClick('resume')}
            >
              Upload Resume
            </Button>
            <Button
              variant="outlined"
              startIcon={<WorkIcon />}
              onClick={() => onButtonClick('jobDesc')}
            >
              Upload Job Description
            </Button>
          </Stack>
        </Box>
        
        {/* File List */}
        {(resumeFile || jobDescFile) && (
          <List>
            {resumeFile && (
              <ListItem
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => removeFile('resume')}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <DescriptionIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={resumeFile.name}
                  secondary={`${(resumeFile.size / 1024).toFixed(2)} KB`}
                />
                <Chip label="Resume" size="small" color="primary" sx={{ ml: 1 }} />
              </ListItem>
            )}
            
            {jobDescFile && (
              <ListItem
                secondaryAction={
                  <IconButton edge="end" aria-label="delete" onClick={() => removeFile('jobDesc')}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  <WorkIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={jobDescFile.name}
                  secondary={`${(jobDescFile.size / 1024).toFixed(2)} KB`}
                />
                <Chip label="Job Description" size="small" color="secondary" sx={{ ml: 1 }} />
              </ListItem>
            )}
          </List>
        )}
      </Stack>
    </Paper>
  );
};

export default FileUploadArea; 