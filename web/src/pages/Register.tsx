import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/auth';
import { authApi } from '../services/api';
import { BhaMailLogo } from '../components/BhaMailLogo';
import { Shield, Check } from 'lucide-react';

export function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      login(response.user, response.token, response.refreshToken);
      navigate('/inbox');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = formData.password.length >= 8 ? 'Strong' : 
                          formData.password.length >= 6 ? 'Medium' : 
                          formData.password.length > 0 ? 'Weak' : '';

  return (
    <div className="gmail-auth-container">
      <div className="gmail-auth-card" style={{ maxWidth: '500px' }}>
        <div className="gmail-auth-logo">
          <div className="flex items-center justify-center mb-8">
            <BhaMailLogo size="lg" showText={true} />
          </div>
        </div>
        
        <h1 className="gmail-auth-title">Create your account</h1>
        <p className="gmail-auth-subtitle">to continue to BhaMail</p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="gmail-form-group">
              <label htmlFor="firstName" className="gmail-label">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="gmail-input"
                autoComplete="given-name"
              />
            </div>
            
            <div className="gmail-form-group">
              <label htmlFor="lastName" className="gmail-label">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="gmail-input"
                autoComplete="family-name"
              />
            </div>
          </div>
          
          <div className="gmail-form-group">
            <label htmlFor="email" className="gmail-label">
              Choose your email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="gmail-input"
              placeholder="your-email@example.com"
              autoComplete="email"
            />
            <p className="text-xs text-gray-500 mt-1">
              You can use letters, numbers & periods
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="gmail-form-group">
              <label htmlFor="password" className="gmail-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="gmail-input"
                placeholder="Create password"
                autoComplete="new-password"
              />
              {passwordStrength && (
                <div className="mt-1">
                  <span className={`text-xs px-2 py-1 rounded ${
                    passwordStrength === 'Strong' ? 'bg-green-100 text-green-800' :
                    passwordStrength === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {passwordStrength}
                  </span>
                </div>
              )}
            </div>
            
            <div className="gmail-form-group">
              <label htmlFor="confirmPassword" className="gmail-label">
                Confirm
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="gmail-input"
                placeholder="Confirm password"
                autoComplete="new-password"
              />
              {formData.confirmPassword && (
                <div className="mt-1">
                  {formData.password === formData.confirmPassword ? (
                    <div className="flex items-center text-green-600 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      Passwords match
                    </div>
                  ) : (
                    <div className="text-red-600 text-xs">
                      Passwords don't match
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">
                  Use a strong password
                </h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'
                    }`}></span>
                    At least 8 characters
                  </li>
                  <li className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      /[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'
                    }`}></span>
                    One uppercase letter
                  </li>
                  <li className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      /[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'
                    }`}></span>
                    One number
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <Link to="/login" className="gmail-btn gmail-btn-text">
              Sign in instead
            </Link>
            
            <button
              type="submit"
              disabled={isLoading}
              className="gmail-btn gmail-btn-primary"
            >
              {isLoading ? 'Creating...' : 'Create account'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              By creating an account, you agree to BhaMail's{' '}
              <a href="#" className="gmail-link">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="gmail-link">Privacy Policy</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}