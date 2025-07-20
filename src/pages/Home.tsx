import React from 'react';
import { Box } from '@mui/material';
import Header from '../components/layout/Header';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import CtaSection from '../components/home/CtaSection';
import Footer from '../components/layout/Footer';

const Home: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <HeroSection />
        <FeaturesSection />
        <CtaSection />
      </Box>
      <Footer />
    </Box>
  );
};

export default Home; 