import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontFamily: 'Merriweather, serif',
            fontSize: '30px',
          }}
        >
          AI Resume Assistant
        </Typography>
        <Box sx={{ display: 'flex', gap: 2}}>
          <Button color="inherit" component={RouterLink} to="/login" sx={{ fontSize: '20px', fontFamily: 'Times New Roman, serif' }}>
            Resume Tailoring
          </Button>
          <Button color="inherit" component={RouterLink} to="/login" sx={{ fontSize: '20px', fontFamily: 'Times New Roman, serif' }}>
            Mock Interviews
          </Button>
          <Button color="inherit" component={RouterLink} to="/login" sx={{ fontSize: '20px', fontFamily: 'Times New Roman, serif' }}>
            Chatbot
          </Button>
          <Button variant="contained" color="primary" component={RouterLink} to="/login" sx={{ fontSize: '20px', fontFamily: 'Times New Roman, serif' }}>
            Login/Sign Up
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 