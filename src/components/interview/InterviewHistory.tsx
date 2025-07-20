import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Chip,
  CircularProgress,
  Button,
  Grid
} from '@mui/material';
import { getUserInterviews, MockInterview } from '../../services/interviewService';
import { formatDistanceToNow } from 'date-fns';

const InterviewHistory: React.FC = () => {
  const [interviews, setInterviews] = useState<MockInterview[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const data = await getUserInterviews();
        setInterviews(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching interview history:', err);
        setError('Failed to load interview history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  // Function to format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  // Function to get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: 'error.light' }}>
        <Typography variant="body1" color="error.dark">
          {error}
        </Typography>
      </Paper>
    );
  }

  if (interviews.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          No Interview History
        </Typography>
        <Typography variant="body1">
          You haven't completed any mock interviews yet. Try recording a new interview to get feedback.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Interview History
      </Typography>
      
      <List sx={{ width: '100%' }}>
        {interviews.map((interview, index) => (
          <React.Fragment key={interview.id}>
            {index > 0 && <Divider component="li" />}
            <ListItem alignItems="flex-start" sx={{ py: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <ListItemText
                    primary={interview.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {interview.job_description ? `For: ${interview.job_description.title}` : 'No job description'}
                        </Typography>
                        <br />
                        {formatDate(interview.created_at)}
                        <br />
                        {`Duration: ${Math.round(interview.duration / 60)} minutes`}
                      </>
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <Chip 
                    label={`Score: ${interview.overall_score}%`} 
                    color={getScoreColor(interview.overall_score)} 
                    sx={{ fontWeight: 'bold', mb: 1 }}
                  />
                  <Button 
                    variant="outlined" 
                    size="small" 
                    href={`/interviews/${interview.id}`}
                  >
                    View Details
                  </Button>
                </Grid>
              </Grid>
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default InterviewHistory; 