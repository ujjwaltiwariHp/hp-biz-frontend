'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { authService } from '@/services/auth.service';

const SignIn: React.FC = () => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
    setApiError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoggingIn(true);
    setErrors({});
    setApiError('');

    try {
      const response = await authService.login(formData);

      if (response.success) {
        toast.success(response.message || 'Login successful!');
        router.push('/dashboard');
      } else {
        const message = response.message || 'Login failed. Please try again.';

        if (message.toLowerCase().includes('inactive')) {
          setApiError('Your account is currently inactive. Please contact support.');
        } else if (message.toLowerCase().includes('invalid') || message.toLowerCase().includes('credentials')) {
          setApiError('Invalid email or password. Please try again.');
        } else {
          setApiError(message);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.response?.data?.message) {
        const errorMsg = error.response.data.message;
        if (errorMsg.toLowerCase().includes('inactive')) {
          setApiError('Your account is currently inactive. Please contact support.');
        } else if (errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('credentials')) {
          setApiError('Invalid email or password. Please try again.');
        } else {
          setApiError(errorMsg);
        }
      } else if (error.response?.status === 401) {
        setApiError('Invalid email or password. Please try again.');
      } else if (error.response?.status === 403) {
        setApiError('Your account is currently inactive. Please contact support.');
      } else if (error.response?.status === 400) {
        setApiError('Please check your email and password and try again.');
      } else {
        setApiError('Something went wrong. Please try again later.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-gray-900 overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-6 2xl:p-12 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
        {mounted && (
          <div className="absolute inset-0">
            <div className="stars-container">
              {[...Array(50)].map((_, i) => (
                <div
                  key={`star-${i}`}
                  className="star"
                  style={{
                    top: `${(i * 23) % 100}%`,
                    left: `${(i * 17) % 100}%`,
                    animationDelay: `${(i * 0.2) % 3}s`,
                    animationDuration: `${2 + (i % 3)}s`
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="relative z-20 text-center px-4 max-w-md">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative w-32 h-32 rounded-3xl border-2 border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                <Building2 size={64} className="text-blue-100" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <h1 className="text-5xl 2xl:text-6xl font-bold text-white mb-4 tracking-tight bg-gradient-to-r from-blue-100 to-purple-200 bg-clip-text text-transparent">
            HP-BIZ
          </h1>

          <p className="text-xl 2xl:text-2xl text-blue-200/80 font-light">
            CRM SaaS Management
          </p>
        </div>

        <style jsx>{`
          .stars-container {
            position: absolute;
            width: 100%;
            height: 100%;
          }
          .star {
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
            animation: twinkle ease-in-out infinite;
          }
          @keyframes twinkle {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.5);
            }
          }
        `}</style>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center min-h-screen lg:min-h-auto p-4 xs:p-5 sm:p-6 md:p-8 bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#1e293b] relative overflow-hidden">
        {mounted && (
          <div className="absolute inset-0 opacity-30">
            <div className="particle-container">
              {[...Array(30)].map((_, i) => (
                <div
                  key={`particle-${i}`}
                  className="particle"
                  style={{
                    top: `${(i * 31) % 100}%`,
                    left: `${(i * 19) % 100}%`,
                    animationDelay: `${(i * 0.3) % 4}s`,
                    animationDuration: `${3 + (i % 2)}s`
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <style jsx>{`
          .particle-container {
            position: absolute;
            width: 100%;
            height: 100%;
          }
          .particle {
            position: absolute;
            width: 3px;
            height: 3px;
            background: rgba(96, 165, 250, 0.6);
            border-radius: 50%;
            animation: float ease-in-out infinite;
          }
          @keyframes float {
            0%, 100% {
              transform: translateY(0) scale(1);
              opacity: 0.4;
            }
            50% {
              transform: translateY(-20px) scale(1.2);
              opacity: 0.8;
            }
          }
        `}</style>

        <div className="w-full max-w-xs xs:max-w-sm sm:max-w-md relative z-10">
          <div className="lg:hidden flex justify-center mb-6 xs:mb-7 sm:mb-8">
            <div className="w-16 xs:w-18 sm:w-20 h-16 xs:h-18 sm:h-20 rounded-2xl border-2 border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl flex items-center justify-center shadow-xl">
              <Building2 size={36} className="text-blue-100 xs:w-9 xs:h-9 sm:w-10 sm:h-10" strokeWidth={1.5} />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl blur-xl opacity-30"></div>

            <div className="relative bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl shadow-2xl p-5 xs:p-6 sm:p-7 md:p-8 border border-white/10">
              <div className="text-center mb-5 xs:mb-6 sm:mb-7">
                <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  Super-Admin LogIn
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 xs:space-y-4.5 sm:space-y-5">
                {apiError && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 xs:p-3.5 sm:p-4">
                    <p className="text-red-300 text-xs xs:text-xs sm:text-sm leading-relaxed">{apiError}</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs xs:text-xs sm:text-sm font-medium text-white mb-1.5 xs:mb-1.5 sm:mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 xs:pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Mail size={16} className="text-blue-300 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                      className={`w-full bg-[#0f172a]/80 border rounded-xl py-2.5 xs:py-2.5 sm:py-3 pl-10 xs:pl-10 sm:pl-12 pr-3 xs:pr-3 sm:pr-4 text-white placeholder-gray-400 text-xs xs:text-sm sm:text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-blue-500/30 focus:ring-blue-500'
                      }`}
                      disabled={isLoggingIn}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-xs xs:text-xs sm:text-sm mt-1 xs:mt-1 sm:mt-1.5">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs xs:text-xs sm:text-sm font-medium text-white mb-1.5 xs:mb-1.5 sm:mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 xs:pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <Lock size={16} className="text-blue-300 xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter your password"
                      className={`w-full bg-[#0f172a]/80 border rounded-xl py-2.5 xs:py-2.5 sm:py-3 pl-10 xs:pl-10 sm:pl-12 pr-10 xs:pr-10 sm:pr-12 text-white placeholder-gray-400 text-xs xs:text-sm sm:text-base focus:outline-none focus:ring-2 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        errors.password
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-blue-500/30 focus:ring-blue-500'
                      }`}
                      disabled={isLoggingIn}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 xs:pr-3 sm:pr-4 flex items-center text-blue-300 hover:text-blue-200 transition-colors disabled:opacity-50"
                      disabled={isLoggingIn}
                    >
                      {showPassword ? (
                        <EyeOff size={16} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                      ) : (
                        <Eye size={16} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs xs:text-xs sm:text-sm mt-1 xs:mt-1 sm:mt-1.5">{errors.password}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 xs:py-2.5 sm:py-3 px-4 xs:px-4 sm:px-4 rounded-xl text-xs xs:text-sm sm:text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e293b] shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02]"
                >
                  {isLoggingIn ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SignInPage = () => (
  <div className="dark">
    <SignIn />
  </div>
);

export default SignInPage;