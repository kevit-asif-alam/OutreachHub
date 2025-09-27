import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [registerData, setRegisterData] = useState({ email: '', password: '', confirmPassword: '' });

  const { login } = useAuth();
  const navigate = useNavigate();

  // Helper function to get error type and message
  const getErrorInfo = (errorMessage: string) => {
    const message = errorMessage.toLowerCase();
    if (message.includes('invalid credentials') || message.includes('wrong password') || message.includes('incorrect')) {
      return {
        type: 'invalid-credentials',
        title: 'Invalid Credentials',
        description: 'The email or password you entered is incorrect. Please check your credentials and try again.',
        icon: ExclamationTriangleIcon,
        color: 'red'
      };
    }
    if (message.includes('not an admin') || message.includes('admin access')) {
      return {
        type: 'admin-access',
        title: 'Admin Access Required',
        description: 'You need admin privileges to access this area. Please contact your administrator or use a different account.',
        icon: InformationCircleIcon,
        color: 'blue'
      };
    }
    if (message.includes('email') && message.includes('required')) {
      return {
        type: 'email-required',
        title: 'Email Required',
        description: 'Please enter your email address to continue.',
        icon: ExclamationTriangleIcon,
        color: 'red'
      };
    }
    if (message.includes('password') && message.includes('required')) {
      return {
        type: 'password-required',
        title: 'Password Required',
        description: 'Please enter your password to continue.',
        icon: ExclamationTriangleIcon,
        color: 'red'
      };
    }
    return {
      type: 'general',
      title: 'Login Failed',
      description: errorMessage || 'An unexpected error occurred. Please try again.',
      icon: ExclamationTriangleIcon,
      color: 'red'
    };
  };

  // Enhanced validation
  const validateForm = () => {
    const errors = { email: '', password: '' };
    let hasErrors = false;

    if (!email.trim()) {
      errors.email = 'Email is required';
      hasErrors = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
      hasErrors = true;
    }

    setFieldErrors(errors);
    return !hasErrors;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setFieldErrors({ email: '', password: '' });
    setSuccessMessage('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password, isAdmin);
      setSuccessMessage('Login successful! Redirecting...');
      
      // Small delay to show success message
      setTimeout(() => {
        if (!isAdmin && result && (result as any).requiresWorkspaceSelection) {
          navigate('/workspace-selection');
        } else {
          navigate(isAdmin ? '/admin' : '/dashboard');
        }
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      // Create admin user
      await authService.adminRegister({ email: registerData.email, password: registerData.password });
      // Immediately login as admin to establish session
      const result = await login(registerData.email, registerData.password, true);
      if (result === undefined) {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-indigo-100">
            <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {showRegister ? 'Create Admin Account' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {showRegister ? (
              'Create a new admin account to manage workspaces'
            ) : (
              <>
                Or{' '}
                <button
                  onClick={() => setShowRegister(true)}
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  create a new admin account
                </button>
              </>
            )}
          </p>
        </div>

        {showRegister ? (
          <form className="mt-8 space-y-6 border border-black rounded-lg p-4" onSubmit={handleRegister}>
            <div className="space-y-4">
              <div>
                <label htmlFor="register-email" className="block text-left text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your email address"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="register-password" className="block text-left text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter your password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-left text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Confirm your password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Back to Login
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6 border border-black rounded-lg p-4" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="block text-left text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                    fieldErrors.email 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-left text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${
                    fieldErrors.password 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                  }`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                />
                {fieldErrors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="admin-login"
                name="admin-login"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
              />
              <label htmlFor="admin-login" className="ml-2 block text-sm text-gray-900">
                Login as Admin
              </label>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Error Display */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <div className="flex items-start">
                  {(() => {
                    const errorInfo = getErrorInfo(error);
                    const IconComponent = errorInfo.icon;
                    return (
                      <>
                        <IconComponent className={`h-5 w-5 text-${errorInfo.color}-400 mr-3 mt-0.5`} />
                        <div className="flex-1">
                          <h3 className={`text-sm font-medium text-${errorInfo.color}-800`}>
                            {errorInfo.title}
                          </h3>
                          <p className={`mt-1 text-sm text-${errorInfo.color}-700`}>
                            {errorInfo.description}
                          </p>
                          {errorInfo.type === 'admin-access' && (
                            <div className="mt-3">
                              <p className="text-xs text-red-600 mb-2">Next steps:</p>
                              <ul className="text-xs text-red-600 space-y-1">
                                <li>• Uncheck "Login as Admin" if you're a regular user</li>
                                <li>• Contact your administrator for admin access</li>
                                <li>• Use different credentials if available</li>
                              </ul>
                            </div>
                          )}
                          {errorInfo.type === 'invalid-credentials' && (
                            <div className="mt-3">
                              <p className="text-xs text-red-600 mb-2">Troubleshooting tips:</p>
                              <ul className="text-xs text-red-600 space-y-1">
                                <li>• Check your email for typos</li>
                                <li>• Ensure Caps Lock is off</li>
                                <li>• Try resetting your password</li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center">
              <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-500">
                Back to Home
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;


