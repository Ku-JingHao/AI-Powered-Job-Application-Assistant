import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Divider, 
  Chip, 
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import SpeedIcon from '@mui/icons-material/Speed';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import { InterviewAnalysisResult } from '../../services/interviewService';

interface InterviewResultsProps {
  results: InterviewAnalysisResult;
  onRetry: () => void;
}

const ScoreRating = ({ score }: { score: number }) => {
  let color = 'error';
  let label = 'Needs Improvement';
  
  if (score >= 80) {
    color = 'success';
    label = 'Excellent';
  } else if (score >= 60) {
    color = 'primary';
    label = 'Good';
  } else if (score >= 40) {
    color = 'warning';
    label = 'Fair';
  }
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress 
          variant="determinate" 
          value={score} 
          color={color as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'} 
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>
      <Box sx={{ minWidth: 35 }}>
        <Typography variant="body2" color="text.secondary">{score}%</Typography>
      </Box>
      <Chip 
        label={label} 
        color={color as 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'} 
        size="small" 
        sx={{ ml: 1 }}
      />
    </Box>
  );
};

const InterviewResults: React.FC<InterviewResultsProps> = ({ results, onRetry }) => {
  const { 
    transcript, 
    audio_analysis, 
    content_analysis, 
    feedback 
  } = results;
  
  const overall_score = content_analysis.overall_score || 0;
  
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ mt: 3, mb: 4 }}>
        Interview Analysis Results
      </Typography>
      
      {/* Overall Score Card */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          Overall Performance
        </Typography>
        <ScoreRating score={overall_score} />
        
        <Typography variant="body1" paragraph>
          {feedback.general_feedback}
        </Typography>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  <SpeedIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Pace
                </Typography>
                <ScoreRating score={audio_analysis.pace_score} />
                <Typography variant="body2">
                  {audio_analysis.pace_feedback}
                </Typography>
                {audio_analysis.wpm && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Words per minute: {audio_analysis.wpm}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  <RecordVoiceOverIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Clarity
                </Typography>
                <ScoreRating score={content_analysis.clarity_score} />
                <Typography variant="body2">
                  {content_analysis.clarity_feedback}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Content Analysis */}
      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Content Analysis
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Strengths
              </Typography>
              <List dense>
                {content_analysis.strengths.map((strength, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircleIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary={strength} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Areas for Improvement
              </Typography>
              <List dense>
                {content_analysis.improvement_areas.map((area, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ErrorIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={area} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Key Topics Covered
              </Typography>
              <Box sx={{ mt: 1 }}>
                {content_analysis.keywords.map((keyword, index) => (
                  <Chip 
                    key={index} 
                    label={keyword} 
                    color="primary" 
                    variant="outlined" 
                    size="small" 
                    sx={{ m: 0.5 }} 
                  />
                ))}
              </Box>
              
              {content_analysis.missing_keywords && content_analysis.missing_keywords.length > 0 && (
                <>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', mt: 2 }}>
                    Missing Important Topics
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {content_analysis.missing_keywords.map((keyword, index) => (
                      <Chip 
                        key={index} 
                        label={keyword} 
                        color="warning" 
                        variant="outlined" 
                        size="small" 
                        sx={{ m: 0.5 }} 
                      />
                    ))}
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
      
      {/* Suggestions */}
      <Accordion defaultExpanded sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Suggestions & Example Answers
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            How to Improve
          </Typography>
          <List dense>
            {feedback.suggestions.map((suggestion, index) => (
              <ListItem key={index} sx={{ pb: 1 }}>
                <ListItemText 
                  primary={`${index + 1}. ${suggestion}`} 
                  primaryTypographyProps={{ style: { whiteSpace: 'normal' } }}
                />
              </ListItem>
            ))}
          </List>
          
          {feedback.sample_answers && feedback.sample_answers.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                Sample Strong Answers
              </Typography>
              <Box sx={{ mt: 1 }}>
                {feedback.sample_answers.map((answer, index) => (
                  <Paper key={index} sx={{ p: 2, my: 2, bgcolor: 'background.paper', borderLeft: '4px solid #4caf50' }}>
                    <Typography variant="body2" style={{ whiteSpace: 'pre-line' }}>
                      {answer}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </>
          )}
        </AccordionDetails>
      </Accordion>
      
      {/* Transcript */}
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">
            <VolumeUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Your Interview Transcript
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 2, 
              backgroundColor: 'rgba(0, 0, 0, 0.02)', 
              borderRadius: 1,
              maxHeight: '300px',
              overflow: 'auto'
            }}
          >
            <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap' }}>
              {transcript}
            </Typography>
          </Paper>
          
          {audio_analysis.filler_words && Object.keys(audio_analysis.filler_words).length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Filler Words Used
              </Typography>
              <Grid container spacing={1}>
                {Object.entries(audio_analysis.filler_words).map(([word, count]) => (
                  <Grid item key={word}>
                    <Chip 
                      label={`${word} (${count})`} 
                      color="error" 
                      variant="outlined" 
                      size="small" 
                      sx={{ m: 0.5 }} 
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
      
      {/* Retry Button */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large" 
          onClick={onRetry}
          startIcon={<RecordVoiceOverIcon />}
        >
          Try Another Interview
        </Button>
      </Box>
    </Box>
  );
};

export default InterviewResults; 