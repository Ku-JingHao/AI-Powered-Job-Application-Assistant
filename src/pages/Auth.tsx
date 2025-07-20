import React from 'react';
import { Box } from '@mui/material';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import AuthForm from '../components/auth/AuthForm';

const Auth: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <AuthForm />
      </Box>
      <Footer />
    </Box>
  );
};

export default Auth; 