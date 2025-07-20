import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Rating,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Stack,
  Button,
  Grid,
} from '@mui/material';
import {
  VolumeUp as VolumeUpIcon,
  InsertChart as InsertChartIcon,
  Download as DownloadIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';

// Mock feedback data - in a real app, this would come from Azure AI analysis
const mockFeedback = {
  clarity: 78,
  confidence: 85,
  relevance: 72,
  pace: 65,
  fillerWords: 12,
  keywordMatches: [
    { keyword: 'leadership', count: 3 },
    { keyword: 'team management', count: 2 },
    { keyword: 'project delivery', count: 1 },
    { keyword: 'agile', count: 1 },
  ],
  suggestions: [
    'Try to reduce filler words like "um" and "like"',
    'Speak a bit more slowly to improve clarity',
    'Include more specific examples to support your claims',
    'Maintain consistent eye contact (based on video analysis)',
  ],
  overallScore: 75,
};

interface FeedbackPanelProps {
  transcription: string;
  isInterviewActive: boolean;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ 
  transcription, 
  isInterviewActive 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
    // In a real app, this would control audio playback
  };

  // Function to render a metric with a linear progress
  const renderMetric = (label: string, value: number) => (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" fontWeight="bold">{value}%</Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={value} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            backgroundImage: 
              value > 80 ? 'linear-gradient(90deg, #4caf50, #8bc34a)' :
              value > 60 ? 'linear-gradient(90deg, #ffeb3b, #ffc107)' :
              'linear-gradient(90deg, #ff9800, #f44336)',
          } 
        }}
      />
    </Box>
  );

  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 0 }}>
          Feedback & Analysis
        </Typography>
        {!isInterviewActive && transcription && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Overall Score:
            </Typography>
            <Chip 
              label={`${mockFeedback.overallScore}/100`} 
              color={mockFeedback.overallScore > 70 ? "success" : "warning"}
              size="small"
            />
          </Box>
        )}
      </Box>
      
      {!transcription ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 40px)' }}>
          <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
            <InsertChartIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2, opacity: 0.7 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Interview Data Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start an interview session to receive AI-powered feedback on your performance.
            </Typography>
          </Box>
        </Box>
      ) : isInterviewActive ? (
        <Box sx={{ height: 'calc(100% - 40px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Interview in Progress
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Complete your interview to see detailed feedback and analysis.
            </Typography>
          </Box>
          
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2, mb: 3 }}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Live Transcription:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {transcription || "Your speech will appear here as you speak..."}
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              AI is analyzing your speech patterns, keywords, and delivery...
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box>
          {/* Audio Playback Controls */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Interview Playback
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between' 
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VolumeUpIcon color="primary" sx={{ mr: 2 }} />
                <Typography variant="body2">
                  Interview Recording
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                startIcon={isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                onClick={togglePlayback}
              >
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
            </Paper>
          </Box>

          {/* Performance Metrics */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Performance Metrics
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              {renderMetric('Clarity', mockFeedback.clarity)}
              {renderMetric('Confidence', mockFeedback.confidence)}
            </Grid>
            <Grid item xs={12} md={6}>
              {renderMetric('Relevance', mockFeedback.relevance)}
              {renderMetric('Speaking Pace', mockFeedback.pace)}
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Keyword Matches */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Keyword Matches
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              These keywords from the job description appeared in your answers:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {mockFeedback.keywordMatches.map((match, index) => (
                <Chip
                  key={index}
                  label={`${match.keyword} (${match.count})`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>

          {/* Improvement Suggestions */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Suggestions for Improvement
          </Typography>
          <List dense>
            {mockFeedback.suggestions.map((suggestion, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemText 
                  primary={suggestion}
                  primaryTypographyProps={{ variant: 'body2' }} 
                />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 3 }} />

          <Box textAlign="center">
            <Button
              variant="outlined"
              color="primary"
              startIcon={<DownloadIcon />}
            >
              Download Interview Report
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
};

export default FeedbackPanel; 