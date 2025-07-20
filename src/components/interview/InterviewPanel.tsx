import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  IconButton,
  Chip,
  CircularProgress,
  Paper,
  Divider
} from '@mui/material';
import { 
  Mic as MicIcon, 
  Stop as StopIcon, 
  PlayArrow as PlayIcon, 
  Pause as PauseIcon,
  Lightbulb as LightbulbIcon,
  CheckCircle as CheckCircleIcon 
} from '@mui/icons-material';

interface InterviewPanelProps {
  onTranscriptionUpdate: (text: string) => void;
}

// Sample questions for different job roles
const sampleQuestions = {
  software: [
    "Tell me about your experience with React and TypeScript.",
    "How do you approach debugging a complex issue in a web application?",
    "Describe a challenging project you worked on and how you overcame obstacles.",
    "How do you stay updated with the latest technologies in software development?",
    "Explain how you would design a scalable web application architecture."
  ],
  data: [
    "How would you explain a complex data analysis to non-technical stakeholders?",
    "Describe your experience with data cleaning and preprocessing.",
    "What machine learning algorithms have you used and for what purposes?",
    "How do you validate the accuracy of your data models?",
    "Tell me about a data project that provided significant business value."
  ],
  marketing: [
    "How do you measure the success of a marketing campaign?",
    "Describe your experience with digital marketing tools and platforms.",
    "How do you identify and target specific audience segments?",
    "Tell me about a marketing strategy you developed that exceeded expectations.",
    "How do you stay current with changing marketing trends and consumer behavior?"
  ]
};

const InterviewPanel: React.FC<InterviewPanelProps> = ({ onTranscriptionUpdate }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [jobRole, setJobRole] = useState('software');
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Mock audio recorder reference
  const recorderRef = useRef<any>(null);

  // Generate a random question based on selected job role
  const generateQuestion = () => {
    const questions = sampleQuestions[jobRole as keyof typeof sampleQuestions];
    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentQuestion(questions[randomIndex]);
  };

  // Initialize with a question
  useEffect(() => {
    generateQuestion();
  }, [jobRole]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = () => {
    // In a real implementation, this would initialize the audio recording API
    setIsRecording(true);
    setRecordingTime(0);
    setTranscription('');
    
    // Simulate starting a recorder
    recorderRef.current = {
      stop: () => {
        return new Promise(resolve => {
          setTimeout(() => resolve(null), 500);
        });
      }
    };
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate stopping the recorder and processing audio
    if (recorderRef.current) {
      await recorderRef.current.stop();
      
      // Simulate transcription process
      setTimeout(() => {
        // Generate mock transcription based on the current question
        const mockTranscriptions: Record<string, string> = {
          "Tell me about your experience with React and TypeScript.": 
            "I've been working with React for about three years now and TypeScript for the past two. I've built several enterprise applications using both technologies. React's component-based architecture has helped me create reusable UI elements, while TypeScript has significantly improved code quality and maintainability through its strong typing system. I've also integrated Redux for state management and used React hooks extensively in recent projects.",
          "How do you approach debugging a complex issue in a web application?":
            "When debugging complex issues, I follow a systematic approach. First, I reproduce the issue to understand its behavior. Then I check browser console logs for errors. I use breakpoints and logging to trace the code execution path. For particularly tricky bugs, I isolate components to test them separately. I also leverage tools like React DevTools and network monitoring. Documentation is crucial, so I keep notes on what I've tried and the results.",
          "default": "Thank you for that question. I believe my experience and skills align well with what you're looking for. I've worked on several projects that required similar expertise, and I'm passionate about continuing to grow in this area. I approach challenges methodically and always focus on delivering high-quality results while collaborating effectively with team members."
        };
        
        const generatedTranscription = mockTranscriptions[currentQuestion] || mockTranscriptions.default;
        setTranscription(generatedTranscription);
        onTranscriptionUpdate(generatedTranscription);
        setIsProcessing(false);
      }, 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRoleSelection = (role: string) => {
    setJobRole(role);
    generateQuestion();
  };

  return (
    <Card elevation={3}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom fontWeight="bold">
          Practice Interview
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip 
            label="Software Development" 
            color={jobRole === 'software' ? 'primary' : 'default'} 
            onClick={() => handleRoleSelection('software')}
            clickable
          />
          <Chip 
            label="Data Science" 
            color={jobRole === 'data' ? 'primary' : 'default'} 
            onClick={() => handleRoleSelection('data')}
            clickable
          />
          <Chip 
            label="Marketing" 
            color={jobRole === 'marketing' ? 'primary' : 'default'} 
            onClick={() => handleRoleSelection('marketing')}
            clickable
          />
        </Box>

        <Paper elevation={1} sx={{ p: 2, mb: 3, backgroundColor: 'background.default', borderLeft: '4px solid', borderColor: 'primary.main' }}>
          <Typography variant="h6" gutterBottom>
            Current Question:
          </Typography>
          <Typography variant="body1">
            {currentQuestion}
          </Typography>
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
                <CircularProgress variant="determinate" value={Math.min(recordingTime * 100 / 120, 100)} color="error" size={80} />
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
                    {formatTime(recordingTime)}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="error" sx={{ mb: 2, animation: 'pulse 1.5s infinite' }}>
                Recording in progress...
              </Typography>
              <Button 
                variant="contained" 
                color="error" 
                startIcon={<StopIcon />} 
                onClick={stopRecording}
              >
                Stop Recording
              </Button>
            </>
          ) : (
            <>
              {isProcessing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body2">Processing your response...</Typography>
                </Box>
              ) : (
                <>
                  <IconButton 
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
                    onClick={startRecording}
                  >
                    <MicIcon fontSize="large" />
                  </IconButton>
                  <Typography variant="body2">Click to start recording your answer</Typography>
                </>
              )}
            </>
          )}
        </Box>

        {transcription && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Your Response:
            </Typography>
            <Paper elevation={1} sx={{ p: 2, backgroundColor: 'background.default' }}>
              <Typography variant="body1">
                {transcription}
              </Typography>
            </Paper>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <LightbulbIcon color="warning" sx={{ mr: 1 }} />
            Interview Tips
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Use the STAR method for behavioral questions (Situation, Task, Action, Result)" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Maintain a clear and confident speaking voice" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Include specific examples from your experience" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircleIcon color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Keep responses concise (1-2 minutes per question)" />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button 
            variant="outlined" 
            onClick={generateQuestion}
            disabled={isRecording || isProcessing}
          >
            Next Question
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default InterviewPanel; 