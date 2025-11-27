import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ShieldCheck, Loader2, LogIn } from 'lucide-react';

const NimbusVaultLogo = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="text-cyan-400 mr-3">
    <path d="M12 10a5 5 0 0 1 0 10v-5h5a5 5 0 0 1-5-5z" />
    <path d="M16 16h2a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2" />
    <path d="M8 8H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2" />
    <path d="M12 2v3" />
    <path d="M12 19v3" />
    <path d="m3.5 7.5 1.8 1.8" />
    <path d="m18.7 14.3 1.8 1.8" />
  </svg>
);

const AnimatedBackgroundStyles = () => (
  <style>
    {`
      @keyframes gradient-animation {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .animated-gradient-bg {
        background: linear-gradient(-45deg, #0f172a, #0b1120, #0a2f3f, #0a3a5a, #0b1120);
        background-size: 400% 400%;
        animation: gradient-animation 15s ease infinite;
      }
      .noise-overlay {
        position: relative;
        overflow: hidden;
      }
      .noise-overlay::before {
        content: "";
        position: absolute; inset: 0;
        background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxu...');
        opacity: 0.05;
        pointer-events: none;
        z-index: 0;
      }
    `}
  </style>
);

const InputField = ({ id, label, type = 'text', placeholder = '', value, onChange, icon }) => {
    const handleChange = (e) => {
      if (!onChange) return;
      try {
        // Preferred: parent passed a setter like `setX` or a function that accepts a string
        onChange(e.target.value);
      } catch (err) {
        // Fallback: parent expects the raw event handler signature `(e) => ...`
        try { onChange(e); } catch (err2) { /* no-op */ }
      }
    };

    return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm text-gray-300 mb-2">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">{icon}</span>
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="w-full p-3 pl-10 rounded-lg bg-black/20 border border-white/20 text-white outline-none focus:ring-2 focus:ring-cyan-400"
          required
        />
      </div>
    </div>
    );
  };

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!isLoginMode) {
      if (!username || !password || !confirmPassword) return setError('Please fill in all fields.');
      if (password !== confirmPassword) return setError('Passwords do not match.');
      if (password.length < 8) return setError('Password must be at least 8 characters.');
    } else {
      if (!username || !password) return setError('Please enter username and password.');
    }

    setIsLoading(true);
    const API_BASE = import.meta.env.VITE_API_URL;
    const endpoint = isLoginMode 
      ? `${API_BASE}/api/login` 
      : `${API_BASE}/api/register`;
    const body = { username, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) setError(data.message || 'An error occurred.');
      else {
        if (isLoginMode) {
          // Store username and uid in localStorage for the dashboard
          localStorage.setItem('username', username);
          localStorage.setItem('uid', data.uid);
          // navigate to dashboard on successful login
          try { navigate('/dashboard'); } catch (e) { window.location.href = '/dashboard'; }
        } else {
          setSuccess('Welcome, ' + username + '! Registration successful.');
        }
        setUsername(''); setPassword(''); setConfirmPassword('');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  // InputField: supports both setter-style `onChange(value)` and event-style `onChange(event)`
  // It tries to call the setter with the new string value first; if that throws (parent expects
  // the raw event), it falls back to calling the original event handler. This keeps the API
  // flexible and prevents focus/cursor issues caused by accidental signature mismatches.
  

  return (
    <div className="relative min-h-screen w-full p-4 animated-gradient-bg">
      <AnimatedBackgroundStyles />

      <div className="flex items-center justify-center min-h-screen relative z-10">
        <div className="w-3/4 max-w-4xl rounded-2xl shadow-2xl animated-gradient-bg p-[2px] mx-auto">
          <main className="w-full p-12 bg-black/20 backdrop-blur-lg rounded-[22px] noise-overlay"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }}>

            <div className="text-center mb-8 relative z-10">
              <div className="flex justify-center items-center mb-4">
                <NimbusVaultLogo />
                <h1 className="text-4xl font-bold text-white ml-2">NimbusVault</h1>
              </div>
              <p className="text-gray-400">Unleashing the Power of Your Data</p>
            </div>

            <form onSubmit={handleSubmit} className="relative z-10">
              {error && <div className="mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30">{error}</div>}
              {success && <div className="mb-4 p-3 bg-green-500/20 text-green-300 rounded-lg border border-green-500/30">{success}</div>}


              <InputField id="username" label="Username" type="text" placeholder="e.g., data_guardian"
                value={username} onChange={(e) => setUsername(e.target.value)} icon={<User size={18} />} />

              <InputField id="password" label="Password" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} icon={<Lock size={18} />} />

              {!isLoginMode && (
                <>
                  <InputField id="confirmPassword" label="Re-enter Password" type="password" placeholder="••••••••"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={<Lock size={18} />} />
                  <div className="text-base text-yellow-300/95 mb-4" aria-live="polite">
                    {confirmPassword && password !== confirmPassword ? 'Passwords do not match.' : ''}
                  </div>
                </>
              )}

              <div className="mt-6">
                <button type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-lg text-white 
                    bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 transition-all"
                  disabled={isLoading}>
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : (isLoginMode ? <LogIn size={20} /> : <ShieldCheck size={20} />)}
                  {isLoading ? 'Processing...' : (isLoginMode ? 'Login' : 'Sign Up')}
                </button>
              </div>

              <div className="text-center mt-6 flex justify-between">
                <a href="#" className="text-sm text-cyan-400 hover:underline">Forgot Password?</a>
                <button type="button" onClick={() => { setIsLoginMode(!isLoginMode); setError(''); setSuccess(''); }}
                  className="text-sm text-cyan-400 hover:underline">
                  {isLoginMode ? "Don't have an account?" : "Already have an account?"}
                </button>
              </div>
            </form>

          </main>
        </div>
      </div>
      
    </div>
  );
}