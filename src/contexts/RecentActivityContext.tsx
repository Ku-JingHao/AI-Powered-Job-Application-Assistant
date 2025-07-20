import React, { createContext, useContext, useState, ReactNode } from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
import MicIcon from '@mui/icons-material/Mic';
import ChatIcon from '@mui/icons-material/Chat';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

export interface Activity {
  id: number;
  type: 'resume' | 'interview' | 'chatbot' | 'application';
  description: string;
  date: string;
  icon: React.ReactNode;
}

// Initial activities data - empty by default
const initialActivities: Activity[] = [];

// Define the context type
interface RecentActivityContextType {
  activities: Activity[];
  addActivity: (
    type: Activity['type'], 
    description: string, 
    icon: React.ReactNode
  ) => void;
}

// Create the context
export const RecentActivityContext = createContext<RecentActivityContextType | undefined>(undefined);

// Create a provider component
export const RecentActivityProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);

  const addActivity = (
    type: Activity['type'], 
    description: string, 
    icon: React.ReactNode
  ) => {
    const newActivity: Activity = {
      id: Date.now(), // Use timestamp as unique ID
      type,
      description,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      icon,
    };

    // Add new activity to the beginning of the list and keep only the most recent 5
    setActivities(prev => [newActivity, ...prev].slice(0, 5));
  };

  return (
    <RecentActivityContext.Provider value={{ activities, addActivity }}>
      {children}
    </RecentActivityContext.Provider>
  );
};

// Custom hook to use the context
export const useRecentActivity = () => {
  const context = useContext(RecentActivityContext);
  if (context === undefined) {
    throw new Error('useRecentActivity must be used within a RecentActivityProvider');
  }
  return context;
}; 