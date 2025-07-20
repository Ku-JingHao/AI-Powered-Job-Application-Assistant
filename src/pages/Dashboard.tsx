import React, { useState } from 'react';
import { Box, Drawer } from '@mui/material';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardContent from '../components/dashboard/DashboardContent';

const Dashboard: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <DashboardHeader onToggleSidebar={handleDrawerToggle} />
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Sidebar for larger screens */}
        <Box
          component="nav"
          sx={{ width: { md: 280 }, flexShrink: { md: 0 } }}
          aria-label="mailbox folders"
        >
          {/* Mobile sidebar */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: 280,
              },
            }}
          >
            <Sidebar />
          </Drawer>
          
          {/* Desktop sidebar */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: 280,
                borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              },
            }}
            open
          >
            <Sidebar />
          </Drawer>
        </Box>
        
        {/* Main content */}
        <DashboardContent />
      </Box>
    </Box>
  );
};

export default Dashboard; 