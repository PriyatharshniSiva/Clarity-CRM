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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const navigate = useNavigate();

  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    setMousePos({ x, y });
  };

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
    <div 
      className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 font-sans overflow-hidden transition-colors duration-300"
      onMouseMove={handleMouseMove}
      style={{
        backgroundImage: "url('/sky-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        animation: "bg-pan 45s linear infinite alternate"
      }}
    >
      
      {/* Main 2-Column Enterprise Login Modal Container */}
      <div className="relative z-10 w-full max-w-5xl rounded-[32px] bg-white text-slate-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] p-2 sm:p-4 flex flex-col lg:flex-row min-h-[640px] animate-fade-up-soft">
        
        {/* LEFT COLUMN: Immersive Visual Panel */}
        <div className="w-full lg:w-1/2 rounded-[24px] relative overflow-hidden flex flex-col justify-between p-8 sm:p-12 group">
          
          {/* Animated Yeti Background Image */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img 
              src="/yeti.png" 
              alt="Yeti Character" 
              className="w-[110%] h-[110%] -left-[5%] -top-[5%] relative max-w-none object-cover transition-transform duration-300 ease-out animate-float"
              style={{ 
                transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)`,
                transformOrigin: 'center center'
              }}
            />
            {/* Subtle Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          </div>





        </div>

        {/* RIGHT COLUMN: Clean Form Panel */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center my-auto text-left">
          
          <div className="my-auto w-full max-w-sm mx-auto">
            {/* Title Header */}
            <div className="mb-8 space-y-2 text-center  animate-stagger-fade" style={{ animationDelay: '200ms' }}>
              <div className="flex justify-center mb-4">
                <img src={logoSrc} alt="Logo" className="h-8 w-auto mix-blend-multiply opacity-80" onError={(e) => e.target.style.display='none'} />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                {forgotMode ? 'Reset Password' : 'WELCOME BACK'}
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                {forgotMode
                  ? 'Enter your User ID to reset your password.'
                  : 'Enter your email and password to access your account'}
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 font-medium  animate-stagger-fade" style={{ animationDelay: '250ms' }}>
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Reset Success Alert */}
            {resetSuccess && (
              <div className="mb-6 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-600 font-medium  animate-stagger-fade" style={{ animationDelay: '250ms' }}>
                <p>{resetSuccess}</p>
                {tempPassAlert && (
                  <p className="mt-1.5 font-mono bg-emerald-100/50 rounded-lg px-2 py-1">{tempPassAlert}</p>
                )}
              </div>
            )}

            {/* LOGIN FORM */}
            {!forgotMode ? (
              <form className="space-y-5" onSubmit={handleLoginSubmit}>
                
                {/* User ID / Email */}
                <div className="space-y-1.5  animate-stagger-fade" style={{ animationDelay: '300ms' }}>
                  <label className="text-xs font-semibold text-slate-600 ml-1">Email</label>
                  <input
                    type="text"
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-transparent bg-slate-50/80 py-3.5 px-4 text-sm text-slate-900 font-medium hover:border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 placeholder:text-slate-400 transition-all outline-none"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5  animate-stagger-fade" style={{ animationDelay: '400ms' }}>
                  <label className="text-xs font-semibold text-slate-600 ml-1">Password</label>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-transparent bg-slate-50/80 py-3.5 px-4 pr-11 text-sm text-slate-900 font-medium hover:border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 placeholder:text-slate-400 transition-all outline-none"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between text-xs font-semibold pt-1  animate-stagger-fade" style={{ animationDelay: '500ms' }}>
                  <label className="flex items-center gap-2 text-slate-500 cursor-pointer select-none hover:text-slate-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="hidden"
                    />
                    {rememberMe ? (
                      <CheckSquare className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-300" />
                    )}
                    <span>Remember me</span>
                  </label>

                  {/* Removed Forgot Password */}
                </div>

                {/* Main Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-black hover:bg-slate-800 text-white py-3.5 text-sm font-semibold transition-all hover:-translate-y-[1px] active:translate-y-[1px] active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100 cursor-pointer  animate-stagger-fade"
                  style={{ animationDelay: '600ms' }}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
                
              </form>
            ) : (
              /* RESET PASSWORD FORM */
              <form className="space-y-5" onSubmit={handleResetSubmit}>
                <div className="space-y-1.5  animate-stagger-fade" style={{ animationDelay: '300ms' }}>
                  <label className="text-xs font-semibold text-slate-600 ml-1">Email / User ID</label>
                  <input
                    type="text"
                    placeholder="Enter User ID (e.g. EM-1004)"
                    className="w-full rounded-xl border border-transparent bg-slate-50/80 py-3.5 px-4 text-sm text-slate-900 font-medium hover:border-slate-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/10 placeholder:text-slate-400 transition-all outline-none"
                    value={resetUserId}
                    onChange={(e) => setResetUserId(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-black hover:bg-slate-800 text-white py-3.5 text-sm font-semibold transition-all hover:-translate-y-[1px] active:translate-y-[1px] active:scale-[0.98] disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100 cursor-pointer  animate-stagger-fade"
                  style={{ animationDelay: '400ms' }}
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
                  className="w-full text-center text-xs text-slate-500 hover:text-slate-800 font-semibold transition-colors py-2 cursor-pointer  animate-stagger-fade"
                  style={{ animationDelay: '500ms' }}
                >
                  Back to Sign In
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
