import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  Drawer,
} from '@mui/material';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import Sidebar from '../components/dashboard/Sidebar';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:8000/users/api';

interface UserProfileData {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  profile: {
    bio: string;
    location: string;
    profile_picture: string;
    job_title: string;
    company: string;
    skills: string;
    phone_number: string;
  };
}

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    bio: '',
    location: '',
    job_title: '',
    company: '',
    skills: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_BASE_URL}/profile/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfileData(response.data);
        // Initialize form data with profile data
        setFormData({
          username: response.data.user.username || '',
          email: response.data.user.email || '',
          first_name: response.data.user.first_name || '',
          last_name: response.data.user.last_name || '',
          phone_number: response.data.profile.phone_number || '',
          bio: response.data.profile.bio || '',
          location: response.data.profile.location || '',
          job_title: response.data.profile.job_title || '',
          company: response.data.profile.company || '',
          skills: response.data.profile.skills || '',
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } catch (err: any) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('access_token');
      
      // Update profile information
      await axios.put(
        `${API_BASE_URL}/profile/`,
        {
          user: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
          },
          profile: {
            bio: formData.bio,
            location: formData.location,
            job_title: formData.job_title,
            company: formData.company,
            skills: formData.skills,
            phone_number: formData.phone_number,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess('Profile updated successfully');
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.new_password !== formData.confirm_password) {
      setError('New passwords do not match');
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('access_token');
      
      // Change password
      await axios.post(
        `${API_BASE_URL}/change-password/`,
        {
          current_password: formData.current_password,
          new_password: formData.new_password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Clear password fields
      setFormData({
        ...formData,
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
      
      setSuccess('Password changed successfully');
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError('Failed to change password. Please check your current password.');
    } finally {
      setSaving(false);
    }
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
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { md: `calc(100% - 280px)` },
          }}
        >
          <Container maxWidth="md">
            <Paper elevation={3} sx={{ p: 4, mt: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  src={profileData?.profile?.profile_picture || "/default-avatar.png"}
                  sx={{ width: 100, height: 100, mr: 3 }}
                />
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {loading ? 'Loading...' : `${formData.first_name} ${formData.last_name}`}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {formData.username}
                  </Typography>
                </Box>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <form onSubmit={handleProfileUpdate}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Bio"
                          name="bio"
                          multiline
                          rows={3}
                          value={formData.bio}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Location"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Job Title"
                          name="job_title"
                          value={formData.job_title}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Skills"
                          name="skills"
                          multiline
                          rows={3}
                          value={formData.skills}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          size="large"
                          disabled={saving}
                        >
                          {saving ? <CircularProgress size={24} /> : "Save Changes"}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>

                  <Typography variant="h5" gutterBottom sx={{ mt: 6 }}>
                    Change Password
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  
                  <form onSubmit={handlePasswordChange}>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Current Password"
                          name="current_password"
                          type="password"
                          value={formData.current_password}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="New Password"
                          name="new_password"
                          type="password"
                          value={formData.new_password}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          name="confirm_password"
                          type="password"
                          value={formData.confirm_password}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          size="large"
                          disabled={saving}
                        >
                          {saving ? <CircularProgress size={24} /> : "Change Password"}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </>
              )}
            </Paper>
          </Container>
        </Box>
      </Box>
      
      {/* Success notification */}
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
      
      {/* Error notification */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile; 