'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock login - in production would call authApi
    setTimeout(() => {
      window.location.href = '/';
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-dark p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="30" stroke="white" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="20" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Solar Ops</span>
          </div>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold text-white mb-4">Solar installation workflow, simplified</h1>
          <p className="text-primary-light text-lg">Manage your solar projects from quote to completion</p>
        </div>
        <div className="relative flex items-center gap-2 text-primary-light text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          System operational
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </div>
            <span className="text-xl font-bold text-text">Solar Ops</span>
          </div>

          <h2 className="text-2xl font-bold text-text mb-2">Welcome back</h2>
          <p className="text-text-muted mb-8">Sign in to your admin account</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text mb-2">Email address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@solarops.co.uk"
                className="h-11"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-2">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                className="h-11"
                required
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-primary hover:underline">Sign in with magic link</a>
          </div>
          <div className="mt-2 text-center">
            <a href="#" className="text-sm text-text-muted hover:text-primary">Forgot password?</a>
          </div>
        </div>
      </div>
    </div>
  );
}
