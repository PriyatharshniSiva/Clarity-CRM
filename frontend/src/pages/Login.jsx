import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, Lock, Loader2, ArrowRight, Eye, EyeOff, RefreshCw, CheckSquare, Square } from 'lucide-react';

const Login = () => {
  const { user, login, requestPasswordReset } = useAuth();
  const { companyName, companyLogo } = useTheme();
  
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
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

  const displayName = companyName || 'CLARITY INFOTECH';
  const logoSrc = companyLogo || '/logo.png';

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 font-sans theme-canvas-bg overflow-hidden transition-colors duration-300">
      
      {/* Decorative ambient background glows (Driven by Theme Primary Color) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div 
          className="absolute -top-40 -left-40 h-[650px] w-[650px] rounded-full blur-3xl opacity-20 transition-all duration-500" 
          style={{ backgroundColor: 'rgb(var(--primary))' }} 
        />
        <div 
          className="absolute -bottom-40 -right-40 h-[650px] w-[650px] rounded-full blur-3xl opacity-20 transition-all duration-500" 
          style={{ backgroundColor: 'rgb(var(--primary))' }} 
        />
      </div>

      {/* Main 2-Column Enterprise Login Modal Container */}
      <div className="relative z-10 w-full max-w-4xl rounded-[32px] bg-card text-card-foreground shadow-2xl shadow-black/10 border border-border/80 overflow-hidden flex flex-col lg:flex-row min-h-[580px] transition-all duration-300">
        
        {/* LEFT COLUMN: Hero Branding Panel with 3D Clockwise Rolling Node Sphere & Centered Logo */}
        <div className="w-full lg:w-1/2 bg-muted/40 border-b lg:border-b-0 lg:border-r border-border/60 p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          
          {/* Dynamic Theme Gradient Background Accent */}
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-500 opacity-10" 
            style={{ 
              background: 'radial-gradient(circle at 30% 30%, rgb(var(--primary)), transparent 70%)' 
            }} 
          />

          {/* Top Brand Tag */}
          <div className="relative z-10 flex items-center gap-2">
            <span 
              className="h-2 w-2 rounded-full animate-pulse" 
              style={{ backgroundColor: 'rgb(var(--primary))' }} 
            />
            <span className="text-[11px] font-extrabold tracking-widest text-muted-foreground uppercase">
              {displayName}
            </span>
          </div>

          {/* CENTER: 3D Connected Node Sphere Animation (Rolling Clockwise with Dynamic Logo in Center) */}
          <div className="relative z-10 my-6 flex items-center justify-center">
            <div className="relative h-72 w-72 sm:h-80 sm:w-80 flex items-center justify-center">
              

              {/* CENTER LOGO: Dynamic Transparent Company Logo */}
              <div className="relative z-20 flex items-center justify-center transition-transform duration-300 hover:scale-105">
                <img
                  src={logoSrc}
                  alt={displayName}
                  className="h-24 sm:h-32 w-auto object-contain mix-blend-multiply drop-shadow-md"
                  onError={(e) => {
                    e.target.src = '/logo.png';
                  }}
                />
              </div>

            </div>
          </div>

          {/* Bottom Descriptor */}
          <div className="relative z-10 space-y-1 text-center lg:text-left">
            <h3 className="text-lg font-black text-primary tracking-tight">
              Enterprise CRM Workspace
            </h3>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              Streamlining team workflows, dynamic builders, and real-time operations.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: Interactive Login Form Panel (Equal Top & Bottom Spacing) */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 flex flex-col justify-center my-auto text-left">
          
          <div className="my-auto w-full">
            {/* Title Header (Center Aligned) */}
            <div className="mb-6 space-y-1 text-center">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-primary text-center">
                {forgotMode ? 'Reset Password' : displayName}
              </h2>
              <p className="text-xs font-semibold text-muted-foreground text-center">
                {forgotMode
                  ? 'Enter your User ID to reset your password to your Date of Birth.'
                  : 'Enter your enterprise credentials to access your portal.'}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-2xl bg-danger/10 border border-danger/20 p-3.5 text-xs text-danger font-semibold">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Reset Success Alert */}
            {resetSuccess && (
              <div className="mb-4 rounded-2xl bg-success/10 border border-success/20 p-3.5 text-xs text-success font-semibold">
                <p>{resetSuccess}</p>
                {tempPassAlert && (
                  <p className="mt-1.5 font-mono text-success bg-success/10 rounded-lg px-2 py-1">{tempPassAlert}</p>
                )}
              </div>
            )}

            {/* LOGIN FORM */}
            {!forgotMode ? (
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                {/* User ID */}
                <div className="space-y-1">
                  <div className="relative group">
                    <User className="absolute left-4 top-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Enter Mail"
                      className="w-full rounded-2xl border border-border/80 bg-muted/20 py-3.5 pl-11 pr-4 text-sm text-foreground font-medium hover:border-primary/40 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/60 transition-all outline-none [&:-webkit-autofill]:shadow-[0_0_0_1000px_rgba(248,250,252,1)_inset] [&:-webkit-autofill]:-webkit-text-fill-color:rgb(30,41,59)"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      autoComplete="username"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="relative group">
                    <Lock className="absolute left-4 top-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter Password"
                      className="w-full rounded-2xl border border-border/80 bg-muted/20 py-3.5 pl-11 pr-11 text-sm text-foreground font-medium hover:border-primary/40 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/60 transition-all outline-none [&:-webkit-autofill]:shadow-[0_0_0_1000px_rgba(248,250,252,1)_inset] [&:-webkit-autofill]:-webkit-text-fill-color:rgb(30,41,59)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                      className="absolute right-4 top-4 text-muted-foreground hover:text-primary transition-colors focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between text-xs font-semibold pt-1">
                  <label className="flex items-center gap-2 text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="hidden"
                    />
                    {rememberMe ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground/40" />
                    )}
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setError(''); }}
                    className="text-primary hover:text-primary-hover font-bold hover:underline transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Main Submit Button (Dynamic Theme Gradient) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground py-3.5 text-sm font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Log In to Account</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* RESET PASSWORD FORM */
              <form className="space-y-4" onSubmit={handleResetSubmit}>
                <div className="space-y-1">
                  <div className="relative group">
                    <User className="absolute left-4 top-4 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      placeholder="Enter User ID (e.g. EM-1004)"
                      className="w-full rounded-2xl border border-border/80 bg-muted/20 py-3.5 pl-11 pr-4 text-sm text-foreground font-medium hover:border-primary/40 focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/10 placeholder:text-muted-foreground/60 transition-all outline-none [&:-webkit-autofill]:shadow-[0_0_0_1000px_rgba(248,250,252,1)_inset] [&:-webkit-autofill]:-webkit-text-fill-color:rgb(30,41,59)"
                      value={resetUserId}
                      onChange={(e) => setResetUserId(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground py-3.5 text-sm font-bold shadow-lg shadow-primary/25 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
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
                  className="w-full text-center text-xs text-muted-foreground hover:text-primary font-semibold transition-colors py-1 cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
