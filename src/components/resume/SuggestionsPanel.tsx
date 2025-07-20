import React, { useState } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Button,
  Chip,
  Stack,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Grid,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  FormatAlignLeft as FormatAlignLeftIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  Code as CodeIcon,
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  MoodBad as MoodBadIcon,
  SentimentSatisfied as SentimentSatisfiedIcon,
  SentimentVerySatisfied as SentimentVerySatisfiedIcon,
} from '@mui/icons-material';
import { analyzeResume, ResumeAnalysisResult } from '../../services/resumeService';

interface SuggestionsPanelProps {
  resumeFile: File | null;
  jobDescFile: File | null;
  onReset?: () => void; // Optional callback for resetting files
}

const SuggestionsPanel: React.FC<SuggestionsPanelProps> = ({ resumeFile, jobDescFile, onReset }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ResumeAnalysisResult | null>(null);

  // Add a helper function to check if sentiment analysis is valid
  const isValidSentimentAnalysis = (sentimentData: any): boolean => {
    return Boolean(
      sentimentData && 
      typeof sentimentData === 'object' && 
      sentimentData.sentiment
    );
  };

  const handleAnalyze = async () => {
    if (!resumeFile || !jobDescFile) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuggestions(null); // Clear previous results

    try {
      const result = await analyzeResume(resumeFile, jobDescFile);
      console.log("Sentiment Analysis Result:", result.sentimentAnalysis); // Debug log
      setSuggestions(result);
    } catch (err) {
      console.error('Error analyzing resume:', err);
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuggestions(null);
    // Call the parent's onReset callback if provided
    if (onReset) {
      onReset();
    } else {
      // Otherwise use the custom event approach as a fallback
      try {
        const resetEvent = new CustomEvent('resetResumeFiles', {
          bubbles: true,
          detail: { message: 'Reset requested' }
        });
        document.dispatchEvent(resetEvent);
        console.log('Reset analysis requested - please upload new files');
      } catch (error) {
        console.error('Error resetting analysis:', error);
      }
    }
  };

  if (!resumeFile || !jobDescFile) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 400, mx: 'auto' }}>
          <Typography variant="h6" color="text.secondary" paragraph>
            Upload your resume and job description to get tailored suggestions.
          </Typography>
        </Box>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Analyzing your resume...</Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleAnalyze}
        >
          Try Again
        </Button>
      </Paper>
    );
  }

  if (!suggestions) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Ready to Analyze
        </Typography>
        <Typography paragraph>
          Your files are ready for analysis. Click the button below to get tailored suggestions.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={handleAnalyze}
        >
          Analyze and Generate Suggestions
        </Button>
      </Paper>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 0 }}>
          Tailored Suggestions
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Match Score:
          </Typography>
          <Chip 
            label={`${suggestions.matchScore}%`} 
            color={suggestions.matchScore > 70 ? "success" : "warning"}
            size="small"
          />
          <Button 
            variant="outlined" 
            color="primary" 
            size="small"
            onClick={handleReset}
          >
            Reset Analysis
          </Button>
        </Box>
      </Box>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        These suggestions are tailored based on the job description you provided.
      </Alert>

      <Stack spacing={2}>
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="keywords-content"
            id="keywords-header"
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Keywords
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Consider adding these keywords from the job description:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {suggestions.keywordsToAdd.length > 0 ? (
                  suggestions.keywordsToAdd.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      icon={<AddIcon />}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))
                ) : (
                  <Typography variant="body2">No missing keywords detected.</Typography>
                )}
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Consider removing these keywords that may be outdated:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {suggestions.keywordsToRemove.length > 0 ? (
                  suggestions.keywordsToRemove.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword}
                      icon={<RemoveIcon />}
                      color="error"
                      variant="outlined"
                      size="small"
                    />
                  ))
                ) : (
                  <Typography variant="body2">No outdated keywords detected.</Typography>
                )}
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* New Accordion for Technical Skills Match */}
        {suggestions.technicalSkillsMatch && suggestions.technicalSkillsMatch.inResume && suggestions.technicalSkillsMatch.inJob && (
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="technical-skills-content"
              id="technical-skills-header"
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Technical Skills Analysis
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Technical skills in your resume:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {suggestions.technicalSkillsMatch.inResume.length > 0 ? (
                      suggestions.technicalSkillsMatch.inResume.map((skill, index) => {
                        // Check if this skill matches any job skill (either exactly or semantically)
                        const hasMatch = suggestions.technicalSkillsMatch?.inJob?.some(
                          jobSkill => jobSkill.toLowerCase() === skill.toLowerCase() || 
                                     jobSkill.toLowerCase().includes(skill.toLowerCase()) || 
                                     skill.toLowerCase().includes(jobSkill.toLowerCase())
                        );
                        
                        return (
                          <Tooltip 
                            key={index} 
                            title={hasMatch ? "This skill matches a requirement in the job description" : ""}
                          >
                            <Chip
                              label={skill}
                              icon={hasMatch ? <CheckCircleIcon /> : <CodeIcon />}
                              color={hasMatch ? "success" : "primary"}
                              size="small"
                              variant={hasMatch ? "filled" : "outlined"}
                            />
                          </Tooltip>
                        );
                      })
                    ) : (
                      <Typography variant="body2">No technical skills detected in your resume.</Typography>
                    )}
                  </Box>
                  {suggestions.technicalSkillsMatch.missing.length > 0 && (
                    <Alert severity="warning" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        You're missing {suggestions.technicalSkillsMatch.missing.length} key technical skills required in the job description.
                      </Typography>
                    </Alert>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Technical skills required in job description:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {suggestions.technicalSkillsMatch.inJob.length > 0 ? (
                      suggestions.technicalSkillsMatch.inJob.map((skill, index) => {
                        // Check if this job skill is found in the resume (either exactly or semantically)
                        const isInResume = suggestions.technicalSkillsMatch?.inResume?.some(
                          resumeSkill => resumeSkill.toLowerCase() === skill.toLowerCase() ||
                                        resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
                                        skill.toLowerCase().includes(resumeSkill.toLowerCase())
                        );
                        
                        return (
                          <Tooltip 
                            key={index}
                            title={isInResume ? "This skill is in your resume" : "Consider adding this skill to your resume"}
                          >
                            <Chip
                              label={skill}
                              icon={isInResume ? <CheckCircleIcon /> : <CodeIcon />}
                              color={isInResume ? "success" : "warning"}
                              size="small"
                              variant={isInResume ? "filled" : "outlined"}
                            />
                          </Tooltip>
                        );
                      })
                    ) : (
                      <Typography variant="body2">No specific technical skills mentioned in job.</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        {/* New Accordion for Soft Skills Match */}
        {suggestions.softSkillsMatch && suggestions.softSkillsMatch.inResume && suggestions.softSkillsMatch.inJob && (
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="soft-skills-content"
              id="soft-skills-header"
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Soft Skills Analysis
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Soft skills in your resume:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {suggestions.softSkillsMatch.inResume.length > 0 ? (
                      suggestions.softSkillsMatch.inResume.map((skill, index) => {
                        // Check if this skill matches any job skill (either exactly or semantically)
                        const hasMatch = suggestions.softSkillsMatch?.inJob?.some(
                          jobSkill => jobSkill.toLowerCase() === skill.toLowerCase() ||
                                     jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
                                     skill.toLowerCase().includes(jobSkill.toLowerCase())
                        );
                        
                        return (
                          <Tooltip 
                            key={index}
                            title={hasMatch ? "This skill matches a requirement in the job description" : ""}
                          >
                            <Chip
                              label={skill}
                              icon={hasMatch ? <CheckCircleIcon /> : <PsychologyIcon />}
                              color={hasMatch ? "success" : "secondary"}
                              size="small"
                              variant={hasMatch ? "filled" : "outlined"}
                            />
                          </Tooltip>
                        );
                      })
                    ) : (
                      <Typography variant="body2">No soft skills detected in your resume.</Typography>
                    )}
                  </Box>
                  {suggestions.softSkillsMatch.missing.length > 0 && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        Consider adding these soft skills mentioned in the job description.
                      </Typography>
                    </Alert>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Soft skills mentioned in job description:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {suggestions.softSkillsMatch.inJob.length > 0 ? (
                      suggestions.softSkillsMatch.inJob.map((skill, index) => {
                        // Check if this job skill is found in the resume (either exactly or semantically)
                        const isInResume = suggestions.softSkillsMatch?.inResume?.some(
                          resumeSkill => resumeSkill.toLowerCase() === skill.toLowerCase() ||
                                        resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
                                        skill.toLowerCase().includes(resumeSkill.toLowerCase())
                        );
                        
                        return (
                          <Tooltip 
                            key={index}
                            title={isInResume ? "This skill is in your resume" : "Consider adding this soft skill to your resume"}
                          >
                            <Chip
                              label={skill}
                              icon={isInResume ? <CheckCircleIcon /> : <PsychologyIcon />}
                              color={isInResume ? "success" : "info"}
                              size="small"
                              variant={isInResume ? "filled" : "outlined"}
                            />
                          </Tooltip>
                        );
                      })
                    ) : (
                      <Typography variant="body2">No specific soft skills mentioned in job.</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        )}

        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="content-suggestions"
            id="content-header"
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Content Suggestions
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {suggestions.contentSuggestions.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <StarIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={suggestion} />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>

        {/* Sentiment Analysis Section */}
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="sentiment-content"
            id="sentiment-header"
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Resume Tone Analysis
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Overall Tone:
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                  {isValidSentimentAnalysis(suggestions?.sentimentAnalysis) ? (
                    suggestions.sentimentAnalysis!.sentiment === 'positive' ? (
                      <Chip
                        icon={<SentimentVerySatisfiedIcon />}
                        label="Positive Tone"
                        color="success"
                        sx={{ fontSize: '1rem' }}
                        size="medium"
                      />
                    ) : suggestions.sentimentAnalysis!.sentiment === 'negative' ? (
                      <Chip
                        icon={<MoodBadIcon />}
                        label="Negative Tone"
                        color="error"
                        sx={{ fontSize: '1rem' }}
                        size="medium"
                      />
                    ) : (
                      <Chip
                        icon={<SentimentSatisfiedIcon />}
                        label="Neutral Tone"
                        color="primary"
                        sx={{ fontSize: '1rem' }}
                        size="medium"
                      />
                    )
                  ) : (
                    <Chip
                      icon={<SentimentSatisfiedIcon />}
                      label="Neutral Tone"
                      color="primary"
                      sx={{ fontSize: '1rem' }}
                      size="medium"
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
            <Box sx={{ mt: 3 }}>
              {isValidSentimentAnalysis(suggestions?.sentimentAnalysis) && (
                <Alert 
                  severity={
                    suggestions.sentimentAnalysis!.sentiment === 'positive' 
                      ? 'success' 
                      : suggestions.sentimentAnalysis!.sentiment === 'negative' 
                        ? 'error' 
                        : 'info'
                  }
                  variant="outlined"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                    What this means for your resume:
                  </Typography>
                  {suggestions.sentimentAnalysis!.sentiment === 'positive' ? (
                    <Typography variant="body2">
                      Your resume has a positive tone, which can create a favorable impression on recruiters. Positive language shows enthusiasm and confidence in your abilities.
                    </Typography>
                  ) : suggestions.sentimentAnalysis!.sentiment === 'negative' ? (
                    <Typography variant="body2">
                      Your resume has some negative tones which may create an unfavorable impression. Consider revising the language to be more positive and achievement-focused.
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      Your resume has a neutral tone. While professional, consider adding more positive language that highlights your achievements and strengths to stand out to recruiters.
                    </Typography>
                  )}
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary">
                <strong>Tip:</strong> Resumes with positive language that emphasizes achievements and results tend to perform better with both ATS systems and human recruiters.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      </Stack>

      <Divider sx={{ my: 3 }} />
    </Paper>
  );
};

export default SuggestionsPanel; 