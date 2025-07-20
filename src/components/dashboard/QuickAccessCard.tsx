import React, { ReactNode } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box,
  SvgIconProps
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useRecentActivity } from '../../contexts/RecentActivityContext';

interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  buttonText: string;
  linkTo: string;
  activityType: 'resume' | 'interview' | 'chatbot' | 'application';
  activityDescription?: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({
  title,
  description,
  icon,
  buttonText,
  linkTo,
  activityType,
  activityDescription,
}) => {
  const { addActivity } = useRecentActivity();

  const handleButtonClick = () => {
    // Create a description if not provided
    const description = activityDescription || `${title} started`;
    // Add this action to recent activities
    addActivity(activityType, description, icon);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', mb: 2, color: 'primary.main' }}>
          {icon}
        </Box>
        <Typography gutterBottom variant="h5" component="h2" fontWeight="bold">
          {title}
        </Typography>
        <Typography sx={{ mb: 3, fontSize: '18px'}} color="text.secondary">
          {description}
        </Typography>
        <Button
          component={RouterLink}
          to={linkTo}
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 'auto', fontSize: '20px'}}
          onClick={handleButtonClick}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QuickAccessCard; 