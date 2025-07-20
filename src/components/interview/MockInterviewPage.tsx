import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Container, 
  CircularProgress,
  Stack,
  Chip,
  Card,
  CardContent,
  IconButton,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip
} from '@mui/material';
import { 
  Mic as MicIcon, 
  Stop as StopIcon,
  Upload as UploadIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  InsertChart as InsertChartIcon,
  VolumeUp as VolumeUpIcon,
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getUserJobDescriptions } from '../../services/resumeService';
import { analyzeInterview, InterviewAnalysisResult } from '../../services/interviewService';
import { initSpeechRecognition } from '../../services/azureSpeechService';
import { analyzeTranscript } from '../../services/clientAnalysisService';
import { useRecentActivity } from '../../contexts/RecentActivityContext';

// Mock feedback data
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

// Interview feedback component
const InterviewFeedback: React.FC<{ 
  analysis: InterviewAnalysisResult | null; 
  transcript: string;
  onRestart?: () => void;
}> = ({ analysis, transcript, onRestart }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create an audio element when the component mounts
    audioRef.current = new Audio();
    
    // Clean up on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const togglePlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Get the audio URL from the global state
      // This assumes audioUrl is available in the parent component
      const audioElement = document.querySelector('audio');
      if (audioElement && audioElement.src) {
        audioRef.current.src = audioElement.src;
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  // When audio ends, reset playing state
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }
  }, [audioRef.current]);

  // Function to render a metric with a linear progress
  const renderMetric = (label: string, value: number) => {
    // Generate a suggestion based on the metric and score
    const getSuggestion = (metricLabel: string, score: number) => {
      const suggestions = {
        Clarity: {
          low: "Try to structure your answers with clear beginning, middle, and end points. Use simpler language when explaining complex concepts.",
          medium: "Your clarity is decent, but consider organizing your thoughts before speaking. Use more transition words to connect ideas.",
          high: "Excellent clarity in your responses. Continue using concise language and well-structured answers."
        },
        Confidence: {
          low: "Practice speaking with a stronger, more assertive tone. Minimize hesitation words and maintain eye contact.",
          medium: "Your confidence is building. Reduce filler words like 'um' and 'uh', and speak at a steady pace to appear more confident.",
          high: "Great confidence level. Your authoritative tone and steady pace project strong expertise."
        },
        Relevance: {
          low: "Focus more on directly answering the question asked. Use the STAR method to structure relevant experiences.",
          medium: "Your answers are generally on topic. Try to align your examples more closely with the specific question being asked.",
          high: "Excellent job keeping responses relevant to the questions. Your examples are well-targeted to the interviewer's needs."
        },
        "Speaking Pace": {
          low: "Your speaking pace is too fast or too slow. Aim for a moderate pace of about 150 words per minute for better comprehension.",
          medium: "Your pace is generally good but varies at times. Practice maintaining a consistent speaking speed throughout your answers.",
          high: "Great speaking pace. You maintain a comfortable rhythm that's easy to follow."
        },
        Volume: {
          low: "Your voice is too quiet or uneven. Practice speaking at a consistent, moderate volume that projects confidence.",
          medium: "Your volume is generally good but fluctuates at times. Focus on maintaining a steady volume throughout your answers.",
          high: "Excellent volume control. You speak clearly and confidently without being too loud or too soft."
        }
      };
      
      const metricKey = metricLabel as keyof typeof suggestions;
      
      if (suggestions[metricKey]) {
        if (score < 60) return suggestions[metricKey].low;
        if (score < 80) return suggestions[metricKey].medium;
        return suggestions[metricKey].high;
      }
      
      return "";
    };
    
    const suggestion = getSuggestion(label, value);
    
    return (
      <Box sx={{ mb: 3 }}>
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
        {suggestion && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
            {suggestion}
          </Typography>
        )}
      </Box>
    );
  };

  // If we don't have analysis or transcript, show empty state
  if (!transcript) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 0 }}>
            Feedback & Analysis
          </Typography>
        </Box>
        
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
      </Paper>
    );
  }

  // If we have a transcript but no analysis, show that it's ready for analysis
  if (transcript && !analysis) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 0 }}>
            Interview Transcript
          </Typography>
        </Box>
        
        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="body2" fontWeight="medium" gutterBottom>
            Your Response:
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {transcript}
          </Typography>
        </Box>
        
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Click "Analyze Interview" to get AI feedback on your response
          </Typography>
        </Box>
      </Paper>
    );
  }

  // If we have analysis data, show the full feedback
  if (analysis) {
    return (
      <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 0 }}>
            Feedback & Analysis
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Overall Score:
            </Typography>
            <Chip 
              label={`${analysis.content_analysis.overall_score}/100`} 
              color={analysis.content_analysis.overall_score > 70 ? "success" : "warning"}
              size="small"
            />
          </Box>
        </Box>
        
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
              startIcon={isPlaying ? <PauseIcon /> : <PlayIcon />}
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
            {renderMetric('Clarity', analysis.content_analysis.clarity_score)}
            {renderMetric('Relevance', analysis.content_analysis.relevance_score)}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderMetric('Speaking Pace', analysis.audio_analysis.pace_score)}
            {renderMetric('Volume', analysis.audio_analysis.volume_score)}
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
            {analysis.content_analysis.keywords.length > 0 ? (
              analysis.content_analysis.keywords.map((keyword, index) => (
                <Chip
                  key={index}
                  label={keyword}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    borderRadius: 1.5, 
                    fontWeight: 'medium',
                    bgcolor: 'rgba(25, 118, 210, 0.08)'
                  }}
                />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                No matching keywords found. Try including more relevant terminology.
              </Typography>
            )}
          </Box>
          
          {analysis.content_analysis.missing_keywords.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Consider including these keywords in your answer:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {analysis.content_analysis.missing_keywords.map((keyword, index) => (
                  <Chip
                    key={index}
                    label={keyword}
                    color="warning"
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 1.5,
                      bgcolor: 'rgba(237, 108, 2, 0.08)'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* Improvement Suggestions */}
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Suggestions for Improvement
        </Typography>
        <List dense>
          {analysis.feedback.suggestions.map((suggestion, index) => (
            <ListItem key={index} sx={{ px: 0, pb: 0.5 }}>
              <ListItemText 
                primary={suggestion}
                primaryTypographyProps={{ 
                  variant: 'body2',
                  sx: index === 0 ? { fontWeight: 'medium' } : {} // Highlight first suggestion 
                }} 
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  }
  
  return null;
};

// A mock version of analyzeInterview that matches the interface
const mockAnalyzeInterview = async (
  audioFile: File,
  transcript: string,
  question: string
): Promise<InterviewAnalysisResult> => {
  // We're just returning a mock result, ignoring the params
  return {
    transcript: transcript,
    audio_analysis: {
      pace_score: 70,
      pace_feedback: "Your speaking pace was good, easy to follow.",
      volume_score: 65,
      volume_feedback: "Your volume was consistent throughout.",
      filler_words_count: 5,
      wpm: 150
    },
    content_analysis: {
      overall_score: 80,
      relevance_score: 85,
      relevance_feedback: "Your answer was relevant to the question asked.",
      clarity_score: 75,
      clarity_feedback: "Your explanations were clear and structured.",
      strengths: ["Relevant experience", "Clear examples", "Good knowledge"],
      improvement_areas: ["Speaking confidence", "Conciseness", "Specific achievements"],
      keywords: ["experience", "problem-solving", "teamwork"],
      missing_keywords: []
    },
    feedback: {
      general_feedback: "A solid interview response that effectively addressed the question. With a bit more confidence and conciseness, it would be even stronger.",
      suggestions: [
        "Speak more confidently",
        "Make responses more concise",
        "Add more specifics about achievements"
      ],
      sample_answers: [
        "A strong sample answer would include specific metrics and outcomes from your experience."
      ]
    }
  };
};

const MockInterviewPage: React.FC = () => {
  // State for steps
  const [activeStep, setActiveStep] = useState(0);
  
  // State for recording
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  
  // State for transcript
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speechRecognitionControls, setSpeechRecognitionControls] = useState<any>(null);
  
  // State for custom job title and questions
  const [questions, setQuestions] = useState<string[]>([
    'Tell me about your youself.',
    'How do you approach debugging a complex issue?',
    'What are your greatest strengths?'
  ]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showQuestionDialog, setShowQuestionDialog] = useState<boolean>(false);
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [editMode, setEditMode] = useState<boolean>(false);
  
  // State for analysis
  const [analysisResult, setAnalysisResult] = useState<InterviewAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Refs for recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const speechRecognitionRef = useRef<{
    startRecognition: () => void;
    stopRecognition: () => void;
  } | null>(null);
  
  const { addActivity } = useRecentActivity();
  
  // Initialize component 
  useEffect(() => {
    // Ensure current question index is valid on component mount
    if (currentQuestionIndex >= questions.length) {
      setCurrentQuestionIndex(0);
    }
  }, []);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      // Stop speech recognition if active
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stopRecognition();
      }
    };
  }, [audioUrl]);
  
  // Handle starting the recording with Azure Speech SDK
  const handleStartRecording = async () => {
    try {
      // Check if media devices are supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Media devices not supported in this browser');
        return;
      }

      // Reset state before starting new recording
      setTranscript('');
      setInterimTranscript('');
      setIsRecording(true);
      setError('');
      setAudioBlob(null);
      setAudioUrl('');
      setAnalysisResult(null);
      
      // Start audio recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.addEventListener('dataavailable', (event) => {
        audioChunks.push(event.data);
      });
      
      mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
      });
      
      // Initialize Speech Recognition
      try {
        const controls = await initSpeechRecognition(
          // Interim results handler
          (text) => {
            setInterimTranscript(text);
          },
          // Final results handler
          (text) => {
            setTranscript((prevTranscript) => {
              // Add a space if needed before appending new text
              const separator = prevTranscript && !prevTranscript.endsWith(' ') ? ' ' : '';
              return prevTranscript + separator + text;
            });
            setInterimTranscript('');
          },
          // Error handler
          (error) => {
            // Don't show Azure initialization errors to the user
            // since we have fallback mechanisms
            if (!error.includes('Failed to initialize') && 
                !error.includes('Speech recognition unavailable')) {
              setError(error);
            } else {
              console.warn(error);
            }
          }
        );
        
        setSpeechRecognitionControls(controls);
        
        // Start speech recognition if we have controls
        if (controls) {
          controls.startRecognition();
        } else {
          console.warn('Speech recognition controls undefined');
        }
      } catch (speechError) {
        console.error('Error initializing speech recognition:', speechError);
        // Continue with recording even if speech recognition fails
        // We'll analyze the audio later
      }
      
      // Start recording and timer
      mediaRecorder.start();
      setMediaRecorder(mediaRecorder);
      
      const startTime = Date.now();
      startTimeRef.current = startTime;
      const timer = setInterval(() => {
        const seconds = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(seconds);
      }, 1000);
      
      setTimerInterval(timer);
      
      // Add activity when recording starts
      addActivity(
        'interview',
        `Started Interview: Question ${currentQuestionIndex + 1}`,
        <MicIcon color="primary" />
      );
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      setError(`Failed to start recording: ${error}`);
    }
  };
  
  // Handle stopping the recording
  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      // Stop all audio tracks in the stream
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      // Stop speech recognition if available
      if (speechRecognitionControls) {
        try {
          speechRecognitionControls.stopRecognition();
        } catch (error) {
          console.error('Error stopping speech recognition:', error);
        }
      }
      
      // Clear the timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      // Add activity when recording stops
      const duration = recordingDuration || 0;
      addActivity(
        'interview',
        `Completed Interview Recording (${duration}s)`,
        <StopIcon color="primary" />
      );
    }
  };
  
  // Handle analyzing the interview
  const handleAnalyzeInterview = async () => {
    if (!audioBlob && !transcript) {
      setError('No recording to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // Create a File object from the Blob for sending to the API
      const audioFile = audioBlob 
        ? new File([audioBlob], 'interview.wav', { type: 'audio/wav' }) 
        : new File([], 'empty.wav');
      
      // Use client-side analysis instead of API
      const result = await analyzeTranscript(
        transcript,
        questions[currentQuestionIndex]
      );

      setAnalysisResult(result);
      
      // Add activity when interview is analyzed
      const score = result?.content_analysis?.overall_score || 'N/A';
      addActivity(
        'interview',
        `Interview Analyzed: Score ${score}`,
        <InsertChartIcon color="primary" />
      );
    } catch (error) {
      console.error('Error analyzing interview:', error);
      setError(`Failed to analyze interview: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Format time (seconds) to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleRoleSelection = (role: string) => {
    // setJobTitle(role);
  };
  
  // Handle next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    }
  };
  
  // Handle previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
    }
  };
  
  // Handle adding a new question
  const handleAddQuestion = () => {
    if (newQuestion.trim() && questions.length < 10) {
      setQuestions([...questions, newQuestion.trim()]);
      setNewQuestion('');
      setShowQuestionDialog(false);
      // Move to the newly added question
      setCurrentQuestionIndex(questions.length);
    }
  };
  
  // Handle updating an existing question
  const handleUpdateQuestion = () => {
    if (newQuestion.trim()) {
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex] = newQuestion.trim();
      setQuestions(updatedQuestions);
      setNewQuestion('');
      setShowQuestionDialog(false);
      setEditMode(false);
    }
  };
  
  // Open dialog to add a new question
  const openAddQuestionDialog = () => {
    setNewQuestion('');
    setEditMode(false);
    setShowQuestionDialog(true);
  };
  
  // Open dialog to edit the current question
  const openEditQuestionDialog = () => {
    setNewQuestion(questions[currentQuestionIndex]);
    setEditMode(true);
    setShowQuestionDialog(true);
  };
  
  // Handle restarting the interview
  const handleRestartInterview = () => {
    // Reset all state related to recording and analysis
    setTranscript('');
    setInterimTranscript('');
    setRecordingDuration(0);
    setAudioBlob(null);
    setAudioUrl('');
    setAnalysisResult(null);
    setError('');
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Mock Interview Practice
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          Practice your interview skills by recording responses to common interview questions. 
          Select a job field below to get relevant questions for your industry.
        </Typography>
      </Box>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
                Practice Interview
              </Typography>
              
              <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: 'background.default', borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
                    Question {currentQuestionIndex + 1} of {questions.length}:
                  </Typography>
                  <Box>
                    <Tooltip title="Edit this question">
                      <IconButton 
                        size="small" 
                        onClick={openEditQuestionDialog} 
                        disabled={isRecording}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {questions.length < 10 && (
                      <Tooltip title="Add new question">
                        <IconButton 
                          size="small" 
                          onClick={openAddQuestionDialog}
                          disabled={isRecording}
                          color="primary"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
                <Typography variant="body1">
                  {questions[currentQuestionIndex]}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                  <Button
                    startIcon={<PrevIcon />}
                    disabled={currentQuestionIndex === 0 || isRecording}
                    onClick={handlePrevQuestion}
                    size="small"
                  >
                    Previous
                  </Button>
                  <Button
                    endIcon={<NextIcon />}
                    disabled={currentQuestionIndex === questions.length - 1 || isRecording}
                    onClick={handleNextQuestion}
                    size="small"
                  >
                    Next
                  </Button>
                </Box>
              </Paper>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                mb: 3, 
                p: 3, 
                borderRadius: 2,
                backgroundColor: 'action.hover' 
              }}>
                {isRecording ? (
                  <>
                    <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                      <CircularProgress variant="determinate" value={Math.min(recordingDuration * 100 / 120, 100)} color="error" size={80} />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography variant="caption" component="div" color="text.secondary">
                          {formatTime(recordingDuration)}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                      Recording in progress...
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="error" 
                      startIcon={<StopIcon />} 
                      onClick={handleStopRecording}
                    >
                      Stop Recording
                    </Button>
                    
                    {/* Real-time transcript display */}
                    {(transcript || interimTranscript) && (
                      <Paper elevation={0} sx={{ mt: 3, p: 2, width: '100%', backgroundColor: 'rgba(0,0,0,0.03)' }}>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Real-time transcript:
                        </Typography>
                        <Typography variant="body2">
                          {transcript}
                          {interimTranscript && (
                            <span style={{ color: 'rgba(0,0,0,0.4)' }}> {interimTranscript}</span>
                          )}
                        </Typography>
                      </Paper>
                    )}
                  </>
                ) : (
                  <>
                    <IconButton 
                      aria-label="start recording"
                      color="primary" 
                      sx={{ 
                        p: 2, 
                        mb: 2,
                        backgroundColor: 'primary.main', 
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        }
                      }} 
                      onClick={handleStartRecording}
                    >
                      <MicIcon sx={{ fontSize: 40 }} />
                    </IconButton>
                    <Typography variant="body2">
                      {transcript ? "Record a new response" : "Click to start recording your answer"}
                    </Typography>
                  </>
                )}
              </Box>
              
              {audioBlob && !isRecording && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Your Recording
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <audio 
                          controls 
                          src={audioUrl} 
                          style={{ height: 40 }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleAnalyzeInterview}
                          disabled={isAnalyzing || !transcript}
                          startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : <InsertChartIcon />}
                          fullWidth
                        >
                          {isAnalyzing ? 'Analyzing...' : 'Analyze Interview'}
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={handleRestartInterview}
                          startIcon={<RefreshIcon />}
                          fullWidth
                        >
                          Restart
                        </Button>
                      </Box>
                    </Box>
                  </Paper>
                  
                  {/* Interview Tips Section */}
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'info.main', color: 'white', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Interview Tips
                    </Typography>
                    <List dense sx={{ pl: 2 }}>
                      <ListItem sx={{ display: 'list-item', listStyleType: 'disc', p: 0, mb: 0.5 }}>
                        <ListItemText 
                          primary="Use the STAR method for behavioral questions (Situation, Task, Action, Result)"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ display: 'list-item', listStyleType: 'disc', p: 0, mb: 0.5 }}>
                        <ListItemText 
                          primary="Maintain a clear and confident speaking voice"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ display: 'list-item', listStyleType: 'disc', p: 0, mb: 0.5 }}>
                        <ListItemText 
                          primary="Include specific examples from your experience"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                      <ListItem sx={{ display: 'list-item', listStyleType: 'disc', p: 0 }}>
                        <ListItemText 
                          primary="Keep responses concise (1-2 minutes per question)"
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    </List>
                  </Box>
                </Box>
              )}
              
              {error && (
                <Box sx={{ mt: 2 }}>
                  {error.startsWith("Note:") ? (
                    <Paper sx={{ p: 2, backgroundColor: 'info.light', color: 'info.contrastText' }}>
                      <Typography variant="body2">
                        {error}
                      </Typography>
                    </Paper>
                  ) : (
                    <Typography variant="body2" color="error">
                      {error}
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <InterviewFeedback 
            analysis={analysisResult} 
            transcript={transcript} 
            onRestart={handleRestartInterview}
          />
        </Grid>
      </Grid>
      
      {/* Question Dialog */}
      <Dialog open={showQuestionDialog} onClose={() => setShowQuestionDialog(false)}>
        <DialogTitle>{editMode ? 'Edit Question' : 'Add New Question'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {editMode 
              ? 'Update the interview question below.' 
              : questions.length >= 9 
                ? 'You can add one more question (maximum 10 questions).'
                : 'Add a new interview question to your practice session.'}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Interview Question"
            type="text"
            fullWidth
            variant="outlined"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowQuestionDialog(false)}>Cancel</Button>
          <Button 
            onClick={editMode ? handleUpdateQuestion : handleAddQuestion} 
            variant="contained" 
            color="primary"
            disabled={!newQuestion.trim()}
          >
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <style>
        {`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            opacity: 1;
          }
        }
        `}
      </style>
    </Container>
  );
};

export default MockInterviewPage; 