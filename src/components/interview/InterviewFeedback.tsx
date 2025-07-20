import React from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Rating,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { InterviewAnalysisResult } from '../../services/interviewService';

interface InterviewFeedbackProps {
  analysis: InterviewAnalysisResult | null;
  transcript: string;
}

const InterviewFeedback: React.FC<InterviewFeedbackProps> = ({ analysis, transcript }) => {
  if (!analysis) {
    return (
      <Paper elevation={3} sx={{ p: 3, mt: 2, minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography color="textSecondary" align="center">
          Record and analyze your interview to see feedback here
        </Typography>
      </Paper>
    );
  }

  // Calculate overall score as an average
  const overallScore = analysis.content_analysis.overall_score;
  const scoreToStars = (score: number) => score / 20; // Convert 0-100 score to 0-5 stars

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        Interview Analysis
      </Typography>
      
      {/* Overall Score Card */}
      <Card elevation={3} sx={{ mb: 2 }}>
        <CardHeader 
          title="Overall Performance" 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'primary.contrastText',
            pb: 1
          }}
        />
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SentimentSatisfiedIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
            <Typography variant="h3">
              {overallScore}%
            </Typography>
          </Box>
          <Rating 
            value={scoreToStars(overallScore)} 
            precision={0.5} 
            readOnly 
            size="large"
          />
        </CardContent>
      </Card>
      
      <Grid container spacing={2}>
        {/* Audio Analysis */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardHeader 
              title="Speaking Performance" 
              sx={{ 
                bgcolor: 'info.main', 
                color: 'info.contrastText',
                pb: 1
              }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ mr: 1 }}>Pace:</Typography>
                <Rating value={scoreToStars(analysis.audio_analysis.pace_score)} readOnly size="small" />
                <Typography variant="body2" sx={{ ml: 1 }}>({analysis.audio_analysis.pace_score}%)</Typography>
              </Box>
              <Typography variant="body2" paragraph>
                {analysis.audio_analysis.pace_feedback}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ mr: 1 }}>Volume:</Typography>
                <Rating value={scoreToStars(analysis.audio_analysis.volume_score)} readOnly size="small" />
                <Typography variant="body2" sx={{ ml: 1 }}>({analysis.audio_analysis.volume_score}%)</Typography>
              </Box>
              <Typography variant="body2" paragraph>
                {analysis.audio_analysis.volume_feedback}
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>Speech Analysis:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {analysis.audio_analysis.filler_words_count !== undefined && (
                    <Chip 
                      label={`${analysis.audio_analysis.filler_words_count} filler words`} 
                      color={analysis.audio_analysis.filler_words_count > 10 ? "warning" : "success"} 
                      size="small" 
                    />
                  )}
                  {analysis.audio_analysis.wpm && (
                    <Chip 
                      label={`${analysis.audio_analysis.wpm} words/min`} 
                      color={analysis.audio_analysis.wpm > 180 ? "warning" : 
                            analysis.audio_analysis.wpm < 120 ? "info" : "success"} 
                      size="small" 
                    />
                  )}
                  {analysis.audio_analysis.duration && (
                    <Chip 
                      label={`${Math.round(analysis.audio_analysis.duration)}s duration`}
                      color="primary" 
                      size="small" 
                    />
                  )}
                </Box>
              </Box>

              {/* Filler Words Detail */}
              {analysis.audio_analysis.filler_words && 
               Object.keys(analysis.audio_analysis.filler_words).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Filler Words Used:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {Object.entries(analysis.audio_analysis.filler_words).map(([word, count]) => (
                      <Chip 
                        key={word}
                        label={`${word} (${count})`} 
                        color="default"
                        variant="outlined"
                        size="small" 
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Pace/Rate Visualization */}
              {analysis.audio_analysis.wpm && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>Speaking Rate:</Typography>
                  <Box sx={{ position: 'relative', width: '100%', height: 35, bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden' }}>
                    {/* Rate zones */}
                    <Box sx={{ position: 'absolute', left: 0, width: '30%', height: '100%', bgcolor: 'info.light', opacity: 0.5 }} />
                    <Box sx={{ position: 'absolute', left: '30%', width: '40%', height: '100%', bgcolor: 'success.light', opacity: 0.5 }} />
                    <Box sx={{ position: 'absolute', left: '70%', width: '30%', height: '100%', bgcolor: 'warning.light', opacity: 0.5 }} />
                    
                    {/* Rate indicator */}
                    <Box sx={{ 
                      position: 'absolute', 
                      left: `${Math.min(Math.max((analysis.audio_analysis.wpm / 250) * 100, 5), 95)}%`, 
                      top: 0,
                      height: '100%', 
                      width: 2,
                      bgcolor: 'primary.dark',
                      transform: 'translateX(-50%)'
                    }} />
                    
                    {/* Labels */}
                    <Box sx={{ position: 'absolute', left: '15%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: 10 }}>Slow</Box>
                    <Box sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: 10 }}>Optimal</Box>
                    <Box sx={{ position: 'absolute', left: '85%', top: '50%', transform: 'translate(-50%, -50%)', fontSize: 10 }}>Fast</Box>
                    
                    {/* WPM indicator */}
                    <Box sx={{ 
                      position: 'absolute', 
                      left: `${Math.min(Math.max((analysis.audio_analysis.wpm / 250) * 100, 5), 95)}%`, 
                      bottom: -16,
                      transform: 'translateX(-50%)',
                      bgcolor: 'background.paper',
                      px: 1,
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      fontSize: 10
                    }}>
                      {analysis.audio_analysis.wpm} WPM
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Content Analysis */}
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: '100%' }}>
            <CardHeader 
              title="Content Quality" 
              sx={{ 
                bgcolor: 'success.main', 
                color: 'success.contrastText',
                pb: 1 
              }}
            />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ mr: 1 }}>Relevance:</Typography>
                <Rating value={scoreToStars(analysis.content_analysis.relevance_score)} readOnly size="small" />
                <Typography variant="body2" sx={{ ml: 1 }}>({analysis.content_analysis.relevance_score}%)</Typography>
              </Box>
              <Typography variant="body2" paragraph>
                {analysis.content_analysis.relevance_feedback}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ mr: 1 }}>Clarity:</Typography>
                <Rating value={scoreToStars(analysis.content_analysis.clarity_score)} readOnly size="small" />
                <Typography variant="body2" sx={{ ml: 1 }}>({analysis.content_analysis.clarity_score}%)</Typography>
              </Box>
              <Typography variant="body2" paragraph>
                {analysis.content_analysis.clarity_feedback}
              </Typography>
              
              {/* Sentiment Analysis if available */}
              {analysis.content_analysis.sentiment && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>Response Tone:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip 
                      label={analysis.content_analysis.sentiment.sentiment.charAt(0).toUpperCase() + 
                            analysis.content_analysis.sentiment.sentiment.slice(1)} 
                      color={
                        analysis.content_analysis.sentiment.sentiment === 'positive' ? 'success' :
                        analysis.content_analysis.sentiment.sentiment === 'negative' ? 'error' : 'primary'
                      }
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                    {analysis.content_analysis.sentiment.confidence && (
                      <Typography variant="caption" color="text.secondary">
                        Confidence: {Math.round(analysis.content_analysis.sentiment.confidence * 100)}%
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Keywords:</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {analysis.content_analysis.keywords.map((keyword, index) => (
                    <Chip key={index} label={keyword} color="success" size="small" />
                  ))}
                  {analysis.content_analysis.missing_keywords.map((keyword, index) => (
                    <Chip key={index} label={keyword} color="error" variant="outlined" size="small" />
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Feedback and Suggestions */}
      <Card elevation={3} sx={{ mt: 2 }}>
        <CardHeader 
          title="Feedback & Suggestions" 
          sx={{ 
            bgcolor: 'warning.main', 
            color: 'warning.contrastText',
            pb: 1
          }}
        />
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <FormatQuoteIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle1">Overall Feedback</Typography>
            </Box>
            <Typography variant="body1" paragraph sx={{ pl: 4 }}>
              {analysis.feedback.general_feedback}
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ThumbUpIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="subtitle1">Strengths</Typography>
                </Box>
                <List dense>
                  {analysis.content_analysis.strengths.map((strength, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={strength} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="subtitle1">Areas to Improve</Typography>
                </Box>
                <List dense>
                  {analysis.content_analysis.improvement_areas.map((area, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <WarningIcon color="warning" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={area} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Grid>
          </Grid>
          
          {analysis.feedback.sample_answers && analysis.feedback.sample_answers.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Sample Answer
              </Typography>
              <Paper elevation={1} sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  {analysis.feedback.sample_answers[0]}
                </Typography>
              </Paper>
            </Box>
          )}
          
          {analysis.feedback.suggestions && analysis.feedback.suggestions.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>
                Suggestions
              </Typography>
              <List dense>
                {analysis.feedback.suggestions.map((suggestion, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircleIcon color="info" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={suggestion} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </CardContent>
      </Card>
      
      {/* Transcript */}
      <Card elevation={3} sx={{ mt: 2 }}>
        <CardHeader 
          title="Your Answer" 
          sx={{ bgcolor: 'grey.100', pb: 1 }}
        />
        <CardContent>
          <Typography variant="body1" paragraph>
            {transcript || analysis.transcript}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InterviewFeedback; 