import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const CtaSection: React.FC = () => {
  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="md">
        <Paper
          elevation={3}
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundImage: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            color: 'white',
            borderRadius: 4,
          }}
        >
          <Typography component="h2" variant="h4" gutterBottom>
            Ready to Supercharge Your Job Search?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, fontWeight: 'normal' }}>
            Sign up today and start using our AI-powered tools to land your dream job.
          </Typography>
          <Button
            component={RouterLink}
            to="/signup"
            variant="contained"
            size="large"
            sx={{
              py: 1.5,
              px: 4,
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
          >
            Get Started for Free
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default CtaSection; 