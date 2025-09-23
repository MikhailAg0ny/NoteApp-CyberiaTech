"use client";
import { useState } from 'react';

export default function LoginPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    try {
      setLoading(true); setError(null);
      const url = mode === 'login' ? `${API_BASE}/api/auth/login` : `${API_BASE}/api/auth/register`;
      const body: any = { email, password };
      if (mode === 'register') body.username = username || email.split('@')[0];
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_id', String(data.user.user_id));
      window.location.href = '/';
    } catch (e:any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-app p-6">
      <div className="card w-full max-w-sm p-6 rounded-xl shadow-md">
        <h1 className="text-xl font-semibold mb-4 text-primary tracking-tight">{mode === 'login' ? 'Login' : 'Create Account'}</h1>
        {mode === 'register' && (
          <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" className="w-full mb-3 px-3 py-2 rounded-md bg-surface border border-default outline-none focus:border-[var(--github-accent)]" />
        )}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" className="w-full mb-3 px-3 py-2 rounded-md bg-surface border border-default outline-none focus:border-[var(--github-accent)]" />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full mb-4 px-3 py-2 rounded-md bg-surface border border-default outline-none focus:border-[var(--github-accent)]" />
        {error && <div className="text-sm text-[var(--github-danger)] mb-3">{error}</div>}
        <button disabled={loading} onClick={submit} className="w-full btn-primary py-2.5 rounded-md font-medium disabled:opacity-60">
          {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Register')}
        </button>
        <div className="mt-4 text-center text-sm text-secondary">
          {mode === 'login' ? (
            <button onClick={()=>setMode('register')} className="text-[var(--github-accent)] hover:underline">Need an account? Register</button>
          ) : (
            <button onClick={()=>setMode('login')} className="text-[var(--github-accent)] hover:underline">Have an account? Login</button>
          )}
        </div>
      </div>
    </div>
  );
}
