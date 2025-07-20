import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Paper,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import MicIcon from '@mui/icons-material/Mic';
import ChatIcon from '@mui/icons-material/Chat';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';

const menuItems = [
  {
    text: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/dashboard',
  },
  {
    text: 'Resume Tailoring',
    icon: <DescriptionIcon />,
    path: '/resume',
  },
  {
    text: 'Mock Interviews',
    icon: <MicIcon />,
    path: '/mock-interview',
  },
  {
    text: 'Interview Chatbot',
    icon: <ChatIcon />,
    path: '/chat',
  },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        position: 'sticky',
        top: 0,
        width: 280,
      }}
    >
      <Box>
        <List component="nav" aria-label="main mailbox folders">
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  py: 1.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    color: 'primary.main',
                    '&:hover': {
                      backgroundColor: 'rgba(33, 150, 243, 0.2)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText 
                  primary={
                    <Typography variant="body1" sx={{ fontSize: '20px'}}>
                      {item.text}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default Sidebar; 