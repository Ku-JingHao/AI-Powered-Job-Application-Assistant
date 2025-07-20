import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Grid,
  Divider,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import loginIllustration from '../../assets/images/login-illustration.png';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

// Define API base URL
const API_BASE_URL = 'http://localhost:8000/users/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form fields
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    job_title: '',
    company: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login
        const response = await api.post('/login/', {
          username: formData.username,
          password: formData.password,
        });

        // Store user data in auth context
        login(
          response.data.access,
          response.data.refresh,
          { username: formData.username }
        );
        
        // Navigate to dashboard
        navigate('/dashboard');
      } else {
        // Register
        const response = await api.post('/register/', formData);
        
        // Store user data in auth context
        login(
          response.data.access,
          response.data.refresh,
          response.data.user
        );
        
        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      if (err.response && err.response.data) {
        // Format error message
        const errorMessage = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        setError(errorMessage);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: 'calc(100vh - 64px)', // Subtract header height
        bgcolor: 'grey.100',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          display: 'flex',
          width: '100%',
          maxWidth: 1000,
          minHeight: 600,
          margin: 'auto',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Left side - image and content */}
        <Box
          sx={{
            flex: 1,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            p: 4,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            AI Resume Assistant
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Your AI-powered job application companion
          </Typography>
          <Box
            component="img"
            src={loginIllustration}
            alt="Login Illustration"
            sx={{
              width: '80%',
              maxWidth: 300,
              mb: 3,
            }}
          />
          <Typography>
            {isLogin
              ? "Don't have an account yet? Join thousands of job seekers who have improved their applications."
              : 'Already have an account? Log in to continue your job search journey.'}
          </Typography>
        </Box>

        {/* Right side - form */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            p: 4,
            overflowY: 'auto',
          }}
        >
          <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
            {isLogin ? 'Login to Your Account' : 'Create an Account'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              variant="outlined"
              margin="normal"
              required
              sx={{ mb: 2 }}
              value={formData.username}
              onChange={handleChange}
            />

            {!isLogin && (
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                variant="outlined"
                type="email"
                margin="normal"
                required
                sx={{ mb: 2 }}
                value={formData.email}
                onChange={handleChange}
              />
            )}

            {!isLogin && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="first_name"
                    variant="outlined"
                    margin="normal"
                    sx={{ mb: 2 }}
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="last_name"
                    variant="outlined"
                    margin="normal"
                    sx={{ mb: 2 }}
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            )}
            
            {!isLogin && (
              <TextField
                fullWidth
                label="Phone Number"
                name="phone_number"
                variant="outlined"
                margin="normal"
                sx={{ mb: 2 }}
                value={formData.phone_number}
                onChange={handleChange}
              />
            )}
            
            {!isLogin && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    name="job_title"
                    variant="outlined"
                    margin="normal"
                    sx={{ mb: 2 }}
                    value={formData.job_title}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company"
                    name="company"
                    variant="outlined"
                    margin="normal"
                    sx={{ mb: 2 }}
                    value={formData.company}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            )}

            <TextField
              fullWidth
              label="Password"
              name="password"
              variant="outlined"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              required
              sx={{ mb: 2 }}
              value={formData.password}
              onChange={handleChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {!isLogin && (
              <TextField
                fullWidth
                label="Confirm Password"
                name="password_confirm"
                variant="outlined"
                type={showConfirmPassword ? 'text' : 'password'}
                margin="normal"
                required
                sx={{ mb: 2 }}
                value={formData.password_confirm}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowConfirmPassword}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {isLogin && (
              <Box sx={{ textAlign: 'right', mb: 2 }}>
                <Link component={RouterLink} to="/forgot-password" variant="body2">
                  Forgot Password?
                </Link>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              sx={{ mt: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : isLogin ? 'Login' : 'Sign Up'}
            </Button>

            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2">
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Link
                  component="button"
                  variant="body2"
                  onClick={toggleForm}
                  sx={{ fontWeight: 'bold' }}
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </Link>
              </Typography>
            </Box>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default AuthForm; 