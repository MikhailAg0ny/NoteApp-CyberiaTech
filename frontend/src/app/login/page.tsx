"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/');
    }
  }, [router]);

  const submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true); 
      setError(null);
      
      const res = await fetch(`${API_BASE}/api/auth/login`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ email, password }) 
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_id', String(data.user.user_id));
      localStorage.setItem('user_name', data.user.username || '');
      localStorage.setItem('user_email', data.user.email || '');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('playSplashAfterLogin', 'true');
      }
      
      // Use router for smoother navigation
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
    } finally { 
      setLoading(false); 
    }
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      submit();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-6 relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[var(--github-accent)]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[var(--github-accent)]/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="card w-full max-w-md p-8 rounded-2xl shadow-2xl anim-scale-in relative z-10 backdrop-blur-sm">
        {/* Logo or Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--github-accent)] to-[var(--github-accent-hover)] shadow-lg shadow-[var(--github-accent)]/25 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-primary tracking-tight">Welcome Back</h1>
          <p className="text-sm text-secondary">Sign in to continue to CyberiaTech</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="anim-slide-up">
            <label className="block text-xs font-semibold text-secondary mb-1.5 tracking-wide">EMAIL</label>
            <input 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              onKeyPress={handleKeyPress}
              placeholder="Enter your email" 
              type="email" 
              className="w-full px-4 py-3 rounded-lg bg-surface border-2 border-default outline-none focus:border-[var(--github-accent)] focus:ring-2 focus:ring-[var(--github-accent)]/20 transition-smooth text-primary placeholder:text-secondary/60" 
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>
          <div className="anim-slide-up" style={{animationDelay: '50ms'}}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-secondary tracking-wide">PASSWORD</label>
              <button type="button" className="text-xs text-[var(--github-accent)] hover:underline">Forgot?</button>
            </div>
            <input 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              onKeyPress={handleKeyPress}
              placeholder="Enter your password" 
              type="password" 
              className="w-full px-4 py-3 rounded-lg bg-surface border-2 border-default outline-none focus:border-[var(--github-accent)] focus:ring-2 focus:ring-[var(--github-accent)]/20 transition-smooth text-primary placeholder:text-secondary/60" 
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>
        </form>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-[var(--github-danger)]/10 border border-[var(--github-danger)]/30 flex items-start gap-2 anim-slide-up">
            <svg className="w-5 h-5 text-[var(--github-danger)] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-[var(--github-danger)]">Error</p>
              <p className="text-xs text-[var(--github-danger)]/80 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <button 
          type="submit"
          disabled={loading} 
          onClick={submit} 
          className="w-full mt-6 btn-primary py-3.5 rounded-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-smooth shadow-lg shadow-[var(--github-accent)]/25 hover:shadow-xl hover:shadow-[var(--github-accent)]/35 active:scale-95 flex items-center justify-center gap-2 relative group"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>

        <div className="mt-6 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-default"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-[var(--github-bg-secondary)] text-secondary">OR</span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link 
            href="/register"
            className="text-sm text-secondary hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
          >
            <span>Don&apos;t have an account?</span>
            <span className="text-[var(--github-accent)] font-semibold group-hover:underline">Sign up</span>
            <svg className="w-3 h-3 text-[var(--github-accent)] group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        {/* Keyboard shortcut hint */}
        <div className="mt-8 pt-6 border-t border-default/40">
          <div className="flex items-center justify-center gap-2 text-xs text-secondary">
            <kbd className="px-2 py-1 bg-surface border border-default rounded text-[10px] font-mono">Enter</kbd>
            <span>to sign in</span>
          </div>
        </div>
      </div>
    </div>
  );
}
