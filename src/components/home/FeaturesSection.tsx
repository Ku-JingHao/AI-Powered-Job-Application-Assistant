import React from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import MicIcon from '@mui/icons-material/Mic';
import ChatIcon from '@mui/icons-material/Chat';
import TimelineIcon from '@mui/icons-material/Timeline';

const features = [
  {
    title: 'Resume Tailoring',
    description:
      'Upload your resume and job description to get AI-powered suggestions for optimizing your resume.',
    icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Mock Interviews',
    description:
      'Practice interviews with our AI interviewer and get real-time feedback on your responses.',
    icon: <MicIcon sx={{ fontSize: 40 }} />,
  },
  {
    title: 'Interview Preparation',
    description:
      'Get personalized tips and answers to common interview questions through our AI chatbot.',
    icon: <ChatIcon sx={{ fontSize: 40 }} />,
  },
];

const FeaturesSection: React.FC = () => {
  return (
    <Box sx={{ py: 8, bgcolor: 'background.default' }}>
      <Container maxWidth="lg">
        <Typography
          component="h2"
          variant="h3"
          align="center"
          color="text.primary"
          gutterBottom
          sx={{ mb: 6 }}
        >
          Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item key={index} xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mb: 2,
                      color: 'primary.main',
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography gutterBottom variant="h5" component="h3">
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary" sx={{fontSize: '18px'}}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturesSection; 