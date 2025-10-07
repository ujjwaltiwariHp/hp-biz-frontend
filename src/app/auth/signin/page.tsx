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

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);

    try {
      const response = await authService.login(formData);

      if (response.success) {
        toast.success('Login successful!');
        router.push('/dashboard');
      } else {
        toast.error(response.message || 'Invalid credentials. Please try again.');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 401) {
        toast.error('Invalid credentials. Please try again.');
      } else {
        toast.error('Something went wrong. Please try again later.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-900">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] overflow-hidden">
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

        <div className="relative z-20 text-center">
          <div className="flex justify-center mb-8">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative w-32 h-32 rounded-3xl border-2 border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                <Building2 size={64} className="text-blue-100" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight bg-gradient-to-r from-blue-100 to-purple-200 bg-clip-text text-transparent">
            HP-BIZ
          </h1>

          <p className="text-2xl text-blue-200/80 font-light">
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

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#1e293b] relative overflow-hidden">
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

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-20 h-20 rounded-2xl border-2 border-blue-400/30 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-xl flex items-center justify-center shadow-xl">
              <Building2 size={40} className="text-blue-100" strokeWidth={1.5} />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-2xl blur-xl opacity-30"></div>

            <div className="relative bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/10">
              <div className="text-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Super-Admin LogIn
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={20} className="text-blue-300" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="Enter your email"
                      className="w-full bg-[#0f172a]/80 border border-blue-500/30 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoggingIn}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={20} className="text-blue-300" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter your password"
                      className="w-full bg-[#0f172a]/80 border border-blue-500/30 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoggingIn}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300 hover:text-blue-200 transition-colors disabled:opacity-50"
                      disabled={isLoggingIn}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#1e293b] shadow-lg hover:shadow-purple-500/50 transform hover:scale-[1.02]"
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