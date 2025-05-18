import api from './api';

export const loginUser = async (credentials) => {
  // try {
    // For real API:
    // const response = await api.post('/auth/login', credentials);
    // return response.data; // Should include user data and token

    // Mock implementation:
    console.log("Simulating login for:", credentials.email);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    let userRole = 'donor';
    if (credentials.email.includes('hospital')) userRole = 'hospital_staff';
    else if (credentials.email.includes('admin')) userRole = 'admin';
    else if (credentials.email.includes('regulator')) userRole = 'regulator';

    if (credentials.password === 'password123') { // Simple mock password check
        const mockUser = {
            id: `user-${Math.random().toString(36).substr(2, 9)}`,
            email: credentials.email,
            name: credentials.email.split('@')[0].replace('.', ' ').replace(/^\w/, c => c.toUpperCase()),
            role: userRole,
            // Add other relevant user fields if needed by frontend immediately after login
            // e.g., hospitalName for hospital_staff
            ...(userRole === 'hospital_staff' && { hospitalName: 'HopeConnect General Hospital' })
        };
        const mockToken = `mock-jwt-token-for-${mockUser.id}-${Date.now()}`;
        return { user: mockUser, token: mockToken };
    } else {
        const error = new Error('Invalid credentials');
        // @ts-ignore
        error.response = { data: { message: 'Invalid email or password. Please try again.' }, status: 401 };
        throw error;
    }

  // } catch (error) {
  //   const errorMessage = error.response?.data?.message || error.message || 'Login failed. Please try again.';
  //   const newError = new Error(errorMessage);
  //   // @ts-ignore
  //   newError.response = error.response; // Preserve original response if available
  //   throw newError;
  // }
};

export const registerUser = async (userData) => {
  try {
    // For real API:
    // const response = await api.post('/auth/register', userData);
    // return response.data;

    // Mock implementation:
    console.log("Simulating registration for:", userData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (userData.email.includes('testfail')) { // Simulate a registration failure
        const error = new Error('Registration failed');
        // @ts-ignore
        error.response = { data: { message: 'This email is already registered or invalid (mock fail).' }, status: 400 };
        throw error;
    }
    return { message: 'Registration successful. Please login.', userId: `new-user-${Math.random().toString(36).substr(2, 9)}` };

  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
    const newError = new Error(errorMessage);
    // @ts-ignore
    newError.response = error.response;
    throw newError;
  }
};

export const verifyToken = async () => { // Example: to check if token is still valid on app load
  try {
    const response = await api.get('/auth/me'); // Or some verify-token endpoint
    return response.data; // User data
  } catch (error) {
    // Error will be handled by the global interceptor in api.js if it's 401
    // Or can be handled specifically here too
    throw error;
  }
};

export const forgotPassword = async (email) => {
    try {
        // const response = await api.post('/auth/forgot-password', { email });
        // return response.data;
        console.log("Simulating forgot password for:", email);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { message: "If an account with this email exists, a password reset link has been sent." };
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Password reset request failed.';
        const newError = new Error(errorMessage);
        // @ts-ignore
        newError.response = error.response;
        throw newError;
    }
};

export const resetPassword = async (token, newPassword) => {
    try {
        // const response = await api.post('/auth/reset-password', { token, newPassword });
        // return response.data;
        console.log("Simulating password reset with token:", token);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return { message: "Password has been reset successfully. You can now login." };
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || 'Password reset failed.';
        const newError = new Error(errorMessage);
        // @ts-ignore
        newError.response = error.response;
        throw newError;
    }
};