import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, Loader2, ArrowRight, Eye, EyeOff, RefreshCw } from 'lucide-react';

const Login = () => {
  const { user, login, requestPasswordReset } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);

  // Forgot Password state
  const [resetUserId, setResetUserId] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [tempPassAlert, setTempPassAlert] = useState('');

  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError('Please enter both your User ID and password.');
      return;
    }
    setError('');
    setLoading(true);
    const res = await login(userId, password);
    setLoading(false);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!resetUserId) {
      setError('Please enter your User ID.');
      return;
    }
    setError('');
    setLoading(true);
    setResetSuccess('');
    setTempPassAlert('');
    const res = await requestPasswordReset(resetUserId);
    setLoading(false);
    if (res.success) {
      setResetSuccess(res.message);
      if (res.tempPassword) {
        setTempPassAlert(`Testing Note: Password reset to DOB: "${res.tempPassword}".`);
      }
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden font-sans theme-canvas-bg">

      {/* Decorative background ambient glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[600px] w-[600px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[600px] w-[600px] rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 h-72 w-72 rounded-full bg-primary/15 blur-2xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(rgba(var(--primary), 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--primary), 0.2) 1px, transparent 1px)',
            backgroundSize: '48px 48px'
          }}
        />
      </div>

      {/* Centered Login card */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-300">

          {/* Card */}
          <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl shadow-black/20 border border-border/40">

            {/* Card content */}
            <div className="relative z-10 p-8 sm:p-10">

              {/* Logo */}
              <div className="flex justify-center mb-5">
                <img
                  src="/logo.png"
                  alt="INNOVEITY"
                  className="h-11 object-contain"
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>

              {/* Header */}
              <div className="mb-8 text-center">
                <p className="text-[13px] text-slate-500 font-semibold tracking-wide">
                  {forgotMode
                    ? 'Enter your User ID to reset your password to your Date of Birth.'
                    : 'Sign in to your Innoveity workspace'}
                </p>
              </div>

              {/* Error alert */}
              {error && (
                <div className="mb-5 flex items-start gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600 font-semibold">
                  <span className="mt-0.5 shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Success alert */}
              {resetSuccess && (
                <div className="mb-5 rounded-2xl bg-primary/10 border border-primary/30 px-4 py-3 text-xs text-primary font-semibold">
                  <p>{resetSuccess}</p>
                  {tempPassAlert && (
                    <p className="mt-1.5 font-mono text-primary bg-primary/20 rounded-lg px-2 py-1">{tempPassAlert}</p>
                  )}
                </div>
              )}

              {/* LOGIN FORM */}
              {!forgotMode ? (
                <form className="space-y-4" onSubmit={handleLoginSubmit}>
                  {/* User ID */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">User ID</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Email ID / User ID"
                        className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-slate-800 font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 transition-all outline-none"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">Password</label>
                      <button
                        type="button"
                        onClick={() => { setForgotMode(true); setError(''); }}
                        className="text-xs text-primary hover:text-primary-hover font-bold hover:underline transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 transition-all outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        tabIndex={-1}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-primary transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl btn-primary py-3 text-sm font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* RESET PASSWORD FORM */
                <form className="space-y-4" onSubmit={handleResetSubmit}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-wide">User ID</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. IN-1001, EM-1001, TL-1001, or AD-0001"
                        className="w-full rounded-xl border border-border bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-800 font-medium focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white placeholder:text-slate-400 transition-all outline-none"
                        value={resetUserId}
                        onChange={(e) => setResetUserId(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary hover:bg-primary-hover py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Reset Password</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setForgotMode(false); setError(''); setResetSuccess(''); }}
                    className="w-full text-center text-xs text-slate-500 hover:text-primary font-semibold transition-colors py-1"
                  >
                    ← Back to Sign In
                  </button>
                </form>
              )}

              {/* Footer note */}
              <p className="mt-7 text-center text-[11px] text-slate-400 font-medium leading-relaxed">
                Your credentials are provided by your organisation admin.
                <br />Contact your admin if you need access.
              </p>

            </div> {/* end z-10 content */}
          </div> {/* end card */}

          {/* Mobile copyright */}
          <p className="mt-6 text-center text-xs text-white/40 font-medium lg:hidden">
            © {new Date().getFullYear()} Innoveity. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
