import React from 'react';
import { 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Box
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { useRecentActivity } from '../../contexts/RecentActivityContext';

const RecentActivity: React.FC = () => {
  // Get activities from the context
  const { activities } = useRecentActivity();

  return (
    <Paper elevation={2} sx={{ p: 3, mt: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{fontSize: '35px'}}>
        Recent Activity
      </Typography>
      
      {activities.length === 0 ? (
        <Box sx={{ 
          py: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          color: 'text.secondary'
        }}>
          <HistoryIcon sx={{ fontSize: 60, mb: 2, opacity: 0.6 }} />
          <Typography variant="body1" sx={{ textAlign: 'center', fontSize: '18px' }}>
            No recent activity yet
          </Typography>
          <Typography variant="body2" sx={{ textAlign: 'center', mt: 1 }}>
            Your activities will appear here after you use the application features
          </Typography>
        </Box>
      ) : (
        <List>
          {activities.map((activity, index) => (
            <React.Fragment key={activity.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem sx={{ py: 1.5 }}>
                <ListItemIcon>{activity.icon}</ListItemIcon>
                <ListItemText
                  primary={activity.description}
                  secondary={activity.date}
                  primaryTypographyProps={{fontWeight: 'medium', fontSize:'20px'}}
                  secondaryTypographyProps={{fontSize:'18px'}}
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default RecentActivity; 