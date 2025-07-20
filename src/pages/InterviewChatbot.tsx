import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  IconButton, 
  Breadcrumbs, 
  Link,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  Avatar,
  Chip,
  Divider,
  Grid,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon, 
  Home as HomeIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  SupportAgent as SupportAgentIcon,
  Info as InfoIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { sendChatMessage, getChatbotFAQTopics } from '../services/resumeService';
import { useRecentActivity } from '../contexts/RecentActivityContext';

// Interface for chat messages
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const InterviewChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi there! I'm your Interview Preparation Assistant. How can I help you prepare for your interviews today?",
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [faqQuestions, setFaqQuestions] = useState<string[]>([
    "How do I answer 'Tell me about yourself'?",
    "What are my greatest strengths?",
    "How to explain employment gaps?",
    "Tips for salary negotiation",
    "How to handle behavioral questions?",
    "Questions to ask the interviewer",
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const { addActivity } = useRecentActivity();

  // Fetch FAQ topics on component mount
  useEffect(() => {
    const fetchFAQTopics = async () => {
      try {
        const response = await getChatbotFAQTopics();
        if (response.topics && response.topics.length > 0) {
          // Format topics to be more user-friendly
          const formattedTopics = response.topics.map(topic => {
            // Convert "tell me about yourself" to "How do I answer 'Tell me about yourself'?"
            return `How do I answer '${topic.charAt(0).toUpperCase() + topic.slice(1)}'?`;
          });
          setFaqQuestions(formattedTopics);
        }
      } catch (error) {
        console.error('Error fetching FAQ topics:', error);
      }
    };

    fetchFAQTopics();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };

    // Add to messages
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      // Record this activity in recent activities
      addActivity(
        'chatbot', 
        `Chatbot: Asked about "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`,
        <ChatIcon color="primary" />
      );

      // Send to backend and get response
      const response = await sendChatMessage(text, sessionId);
      
      // Update session ID if returned from backend
      if (response.session_id) {
        setSessionId(response.session_id);
      }
      
      // Add bot response to messages
      const botMessage: Message = {
        id: messages.length + 2,
        text: response.message,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting response from chatbot:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "I'm sorry, I'm having trouble connecting to my knowledge base right now. Please try again later.",
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const handleFAQClick = (question: string) => {
    setInputValue(question);
    handleSendMessage(question);
  };

  return (
    <Box sx={{ flexGrow: 1, py: 4, px: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
          <IconButton 
            component={RouterLink} 
            to="/dashboard" 
            color="primary" 
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
              <Link 
                component={RouterLink} 
                to="/"
                color="inherit"
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                Home
              </Link>
              <Link
                component={RouterLink}
                to="/dashboard"
                color="inherit"
              >
                Dashboard
              </Link>
              <Typography color="text.primary">Interview Preparation Chatbot</Typography>
            </Breadcrumbs>
            
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Interview Preparation Chatbot
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Get answers to common interview questions and personalized advice
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            {/* Chat interface */}
            <Paper 
              elevation={3} 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '70vh',
                borderRadius: 2,
              }}
            >
              {/* Chat messages area */}
              <Box 
                sx={{ 
                  flexGrow: 1, 
                  overflowY: 'auto', 
                  p: 2,
                  backgroundColor: 'grey.50',
                  borderTopLeftRadius: 8,
                  borderTopRightRadius: 8,
                }}
              >
                <List>
                  {messages.map((message) => (
                    <ListItem 
                      key={message.id} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: 'flex', maxWidth: '80%', alignItems: 'flex-start' }}>
                        {message.sender === 'bot' && (
                          <Avatar 
                            sx={{ 
                              bgcolor: 'primary.main', 
                              mr: 1,
                              width: 36, 
                              height: 36,
                              mt: 0.5
                            }}
                          >
                            <BotIcon fontSize="small" />
                          </Avatar>
                        )}
                        
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            backgroundColor: message.sender === 'user' ? 'primary.light' : 'white',
                            color: message.sender === 'user' ? 'white' : 'text.primary',
                            ml: message.sender === 'user' ? 1 : 0,
                            mr: message.sender === 'bot' ? 1 : 0,
                          }}
                        >
                          <Typography variant="body1">{message.text}</Typography>
                          <Typography variant="caption" color={message.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary'} sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Paper>
                        
                        {message.sender === 'user' && (
                          <Avatar 
                            sx={{ 
                              bgcolor: 'secondary.main', 
                              ml: 1,
                              width: 36, 
                              height: 36,
                              mt: 0.5
                            }}
                          >
                            <PersonIcon fontSize="small" />
                          </Avatar>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                  
                  {isTyping && (
                    <ListItem sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', maxWidth: '80%', alignItems: 'flex-start' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'primary.main', 
                            mr: 1,
                            width: 36, 
                            height: 36,
                            mt: 0.5
                          }}
                        >
                          <BotIcon fontSize="small" />
                        </Avatar>
                        <Paper 
                          variant="outlined" 
                          sx={{ 
                            p: 2, 
                            borderRadius: 2, 
                            backgroundColor: 'white',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          {isLoading ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CircularProgress size={16} sx={{ mr: 1 }} />
                              <Typography variant="body2">Thinking...</Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2">Typing<span className="typing-animation">...</span></Typography>
                          )}
                        </Paper>
                      </Box>
                    </ListItem>
                  )}
                  
                  <div ref={messagesEndRef} />
                </List>
              </Box>
              
              {/* Input area */}
              <Box 
                sx={{ 
                  p: 2, 
                  borderTop: '1px solid', 
                  borderColor: 'divider',
                  backgroundColor: 'white',
                  borderBottomLeftRadius: 8,
                  borderBottomRightRadius: 8,
                }}
              >
                <Box sx={{ display: 'flex' }}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type your question here..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage();
                      }
                    }}
                    sx={{ mr: 1 }}
                    size="small"
                    disabled={isLoading}
                  />
                  <Button 
                    variant="contained" 
                    color="primary" 
                    endIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                  >
                    {isLoading ? 'Sending' : 'Send'}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box>
              {/* FAQ Section */}
              <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Common Questions
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Click on any question to get an instant answer:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {faqQuestions.map((question, index) => (
                    <Button 
                      key={index} 
                      variant="outlined"
                      color="primary"
                      size="medium"
                      onClick={() => handleFAQClick(question)}
                      sx={{ 
                        justifyContent: 'flex-start', 
                        textAlign: 'left',
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                      }}
                      disabled={isLoading}
                    >
                      {question}
                    </Button>
                  ))}
                </Box>
              </Paper>
              
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default InterviewChatbot; 