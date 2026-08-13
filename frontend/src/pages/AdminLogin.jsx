import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ShieldAlert, User, Lock, ArrowRight, Loader2 } from 'lucide-react';

const AdminLogin = () => {
  const { user, login, logout } = useAuth();
  const { companyLogo } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!userId.trim() || !password) {
      setError('Admin ID and Password are required.');
      return;
    }

    setLoading(true);
    const res = await login(userId, password);
    
    if (res.success) {
      if (res.role !== 'ADMIN' && res.role !== 'SUPER_ADMIN') {
        logout();
        setError('Access Denied. You do not have administrator privileges.');
        setLoading(false);
      }
      // If admin, useEffect will handle navigation when context is ready
    } else {
      setError(res.message || 'Authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center relative overflow-hidden"
      style={{ backgroundImage: `url('/admin-bg.png')`, backgroundColor: '#0f172a' }}
    >
      {/* 
        REMOVED: <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div> 
        Because it was blurring and hiding the lamp and background!
      */}

      {/* Prominent CSS Lamp Fixture */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-0 flex flex-col items-center">
        <div className="w-48 h-16 bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-b-2 border-slate-800 rounded-b-xl shadow-2xl relative z-10 flex justify-center">
          {/* Light Bulb & Extreme Glow */}
          <div className="absolute -bottom-1 w-32 h-6 bg-[#fff3c4] blur-[3px] rounded-b-full"></div>
          <div className="absolute top-10 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(255,220,120,0.25)_0%,transparent_70%)] pointer-events-none"></div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-[400px] bg-white/10 backdrop-blur-md border border-white/20 rounded-[2rem] p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] mx-4 mt-12">
        
        <h2 className="text-[28px] font-bold text-white text-center mb-8 drop-shadow-md">
          Login
        </h2>

        {error && (
          <div className="mb-6 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm font-medium text-center backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          <div className="relative">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Username"
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/70 rounded-full py-3 pl-6 pr-12 outline-none focus:bg-white/20 focus:border-white/40 transition-all shadow-inner text-sm"
              required
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/80">
              <User className="h-4 w-4" />
            </div>
          </div>

          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-white/10 border border-white/20 text-white placeholder-white/70 rounded-full py-3 pl-6 pr-12 outline-none focus:bg-white/20 focus:border-white/40 transition-all shadow-inner text-sm"
              required
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/80">
              <Lock className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-white/80 px-2 pt-1 font-medium">
            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
              <input type="checkbox" className="w-3 h-3 rounded-sm border-white/30 bg-white/10 text-white focus:ring-0 cursor-pointer accent-white" />
              <span>Remember me</span>
            </label>
            <a href="#" className="hover:text-white hover:underline transition-colors">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold rounded-full py-3 mt-6 hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-[0_0_15px_rgba(255,255,255,0.3)] text-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Login"}
          </button>

          <div className="text-center text-[11px] text-white/70 mt-6">
            Don't have an account? <a href="#" className="text-white font-bold hover:underline ml-1">Register</a>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
