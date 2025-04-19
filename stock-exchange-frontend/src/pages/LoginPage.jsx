// File: src/pages/LoginPage.js
import React, { useState } from 'react';
import { 
  Container, Box, Typography, TextField, Button, Paper 
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled component for the background with a space-like gradient.
const BackgroundBox = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', // A sample space gradient
}));

// Styled component for the container holding branding and the form.
const FormContainer = styled(Paper)(({ theme }) => ({
  display: 'flex',
  width: '80%',
  maxWidth: '800px',
  height: '400px',
  //overflow: 'hidden',
 //borderRadius: '10px',
}));

// Styled component for the branding section.
const BrandingSection = styled(Box)(({ theme }) => ({
  flex: 1,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(2),
}));

// Styled component for the form section.
const FormSection = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start', // align left within this section
  padding: theme.spacing(4),
}));

const LoginPage = () => {
  // State hooks for managing form inputs and messages.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  // Form submission handler.
  const handleSubmit = async (event) => {
    event.preventDefault();
    // Build login payload. In a real app, you'll call your backend.
    const loginData = {
      email_address: email,
      password: password,
    };
    
    // Simulate a successful login response.
    // Replace this with your actual API call.
    setMessage('Login successful!');
    // Reset form fields if needed.
    setEmail('');
    setPassword('');
  };

  return (
    <BackgroundBox>
      <FormContainer elevation={6}>
        {/* Branding Section on the Left */}
        <BrandingSection>
          <Typography variant="h3">
            Your Brand
          </Typography>
        </BrandingSection>
        {/* Form Section on the Right */}
        <FormSection>
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
              Login
            </Typography>
            <TextField
              label="Email Address"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
            >
              Login
            </Button>
            {message && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                {message}
              </Typography>
            )}
          </Box>
        </FormSection>
      </FormContainer>
    </BackgroundBox>
  );
};

export default LoginPage;
