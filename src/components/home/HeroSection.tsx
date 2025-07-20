import React from 'react';
import { Box, Container, Typography, Button, Grid } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import heroImage from '../../assets/images/hero-image.png';

const HeroSection: React.FC = () => {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        pt: 8,
        pb: 6,
        backgroundImage: 'linear-gradient(45deg,rgba(109, 177, 234, 0.86) 30%,rgb(39, 186, 219) 90%)',
        color: 'white',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography
              component="h1"
              variant="h2"
              align="left"
              color="inherit"
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Your AI-Powered Job Application Assistant
            </Typography>
            <Typography
              variant="h5"
              align="left"
              color="inherit"
              sx={{ mb: 4, fontFamily:'Average' }}
            >
              Tailor your resume, practice interviews, and track your applications
              with the power of AI. Get personalized feedback and improve your
              chances of landing your dream job.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                component={RouterLink}
                to="/signup"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'grey.100',
                  },
                  fontSize: '20px',
                }}
              >
                Get Started
              </Button>
              <Button
                component={RouterLink}
                to="/about"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                  },
                  fontSize: '20px',
                }}
              >
                Learn More
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src={heroImage}
              alt="AI Resume Assistant"
              sx={{
                width: '100%',
                maxWidth: 500,
                display: 'block',
                margin: 'auto',
                borderRadius: 2,
                boxShadow: 3,
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection; 