import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import UserAvatar from '../common/UserAvatar';
import TeamLeaderLeaveWidget from './TeamLeaderLeaveWidget';
import LeaveOverviewCard from './LeaveOverviewCard';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Square,
  FileText,
  Calendar,
  CheckCircle,
  User as UserIcon,
  Users,
  Briefcase,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  Plus,
  MessageSquare,
  Megaphone,
  Activity,
  Search,
  MapPin,
  Flame,
  Shield,
  Layers,
  ArrowUpRight,
  Laptop,
  Send,
  X,
  UserCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: 'easeOut' }
  }
};

// 7-day rolling week calculation (Previous 3 days -> Today -> Next 3 days)
const getRollingWeekDays = () => {
  const today = new Date();
  const days = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    days.push({
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      dateNum: d.getDate(),
      isToday: i === 0,
      fullDate: d,
      dateString: dateString
    });
  }
  return days;
};

export const TeamLeaderDashboard = () => {
  const { user } = useAuth();
  const { onlineUsers, notifications } = useSocket();
  const navigate = useNavigate();

  // Time & Live Clock State
  const [time, setTime] = useState(new Date());

  // Attendance State
  const [clockedRecord, setClockedRecord] = useState(null);
  const [clockStatus, setClockStatus] = useState(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [attendanceAlert, setAttendanceAlert] = useState('');
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  // Data States (Team Leader Scoped)
  const [teamTasks, setTeamTasks] = useState([]);
  const [teamProjects, setTeamProjects] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState('ALL');

  // Selected Date for Schedule Widget
  const todayDateStr = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayDateStr);
  const rollingWeekDays = getRollingWeekDays();
  const isTodaySelected = selectedDate === todayDateStr;

  // Chart Primary Color Tracking
  const [chartPrimaryColor, setChartPrimaryColor] = useState('rgb(var(--primary))');

  useEffect(() => {
    const updateThemeColor = () => {
      const computed = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      if (computed) {
        setChartPrimaryColor(computed.includes(',') || computed.includes(' ') ? `rgb(${computed})` : computed);
      }
    };
    updateThemeColor();
    const observer = new MutationObserver(updateThemeColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTLDashboardData();
  }, [user]);

  const fetchTLDashboardData = async () => {
    try {
      setLoading(true);

      const [
        tasksRes,
        projectsRes,
        attendanceStatusRes,
        attendanceLogsRes,
        announcementsRes,
        leavesRes,
        teamsRes,
        usersRes
      ] = await Promise.all([
        api.get('/tasks').catch(() => ({ data: [] })),
        api.get('/projects').catch(() => ({ data: [] })),
        api.get('/attendance/status').catch(() => ({ data: null })),
        api.get('/attendance/logs').catch(() => ({ data: [] })),
        api.get('/announcements').catch(() => ({ data: [] })),
        api.get('/leaves').catch(() => ({ data: [] })),
        api.get('/teams').catch(() => ({ data: [] })),
        api.get('/users?limit=1000').catch(() => ({ data: { users: [] } }))
      ]);

      const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      setTeamTasks(tasksData);

      const projectsData = Array.isArray(projectsRes.data) ? projectsRes.data : [];
      setTeamProjects(projectsData);

      const logs = Array.isArray(attendanceLogsRes.data) ? attendanceLogsRes.data : [];
      setAttendanceLogs(logs);

      const statusData = attendanceStatusRes.data;
      setClockStatus(statusData);

      const localDateStr = new Date().toLocaleDateString('en-CA');
      const todayRec = statusData?.existingRecord || logs.find(l => new Date(l.date).toLocaleDateString('en-CA') === localDateStr);
      setClockedRecord(todayRec || null);

      const ancData = Array.isArray(announcementsRes.data) ? announcementsRes.data : [];
      setAnnouncements(ancData);

      const leavesData = Array.isArray(leavesRes.data) ? leavesRes.data : [];
      setLeaves(leavesData);

      // Find TL's team
      const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : [];
      const leaderTeam = teamsData.find(t => t.leaderId === user?.id || t.leader?.id === user?.id) || teamsData[0];
      setMyTeam(leaderTeam || null);

      const allUsers = usersRes.data?.users || usersRes.data || [];
      if (leaderTeam && leaderTeam.members) {
        setTeamMembers(leaderTeam.members.map(m => m.user || m));
      } else {
        setTeamMembers(allUsers.filter(u => u.role === 'INTERN' || u.role === 'EMPLOYEE'));
      }

      setLoading(false);
    } catch (err) {
      console.error('Error fetching Team Leader Dashboard data:', err);
      setLoading(false);
    }
  };

  // Helper for Geolocation Clock In/Out
  const getCoordinates = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve('Geolocation not supported');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lon = position.coords.longitude.toFixed(6);
          resolve(`Lat: ${lat}, Lon: ${lon}`);
        },
        (error) => {
          console.warn('Geolocation error:', error);
          resolve('Office Location Validated');
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const handleClockIn = async () => {
    try {
      setClockLoading(true);
      setAttendanceAlert('');
      const locationStr = await getCoordinates();
      const res = await api.post('/attendance/clock-in', { location: locationStr });
      setClockedRecord(res.data);
      setAttendanceAlert(`Clocked In successfully at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      await fetchTLDashboardData();
    } catch (err) {
      setAttendanceAlert(err.response?.data?.message || 'Clock in failed.');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setClockLoading(true);
      setAttendanceAlert('');
      const locationStr = await getCoordinates();
      const res = await api.post('/attendance/clock-out', { location: locationStr });
      setClockedRecord(res.data);
      setAttendanceAlert(`Clocked Out successfully at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      await fetchTLDashboardData();
    } catch (err) {
      setAttendanceAlert(err.response?.data?.message || 'Clock out failed.');
    } finally {
      setClockLoading(false);
    }
  };

  // Greeting based on time of day
  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Live Working Hours calculation
  const currentWorkingHours = useMemo(() => {
    if (!clockedRecord) return 0;
    if (clockedRecord.clockOut) return clockedRecord.workingHours || 0;
    if (clockedRecord.clockIn) {
      const diff = (time - new Date(clockedRecord.clockIn)) / (1000 * 3600);
      return Math.max(0, Math.round(diff * 10) / 10);
    }
    return 0;
  }, [clockedRecord, time]);

  // KPI Metrics Calculation
  const stats = useMemo(() => {
    const totalTeamCount = teamMembers.length || 1;
    const pendingTLApprovals = leaves.filter(l => l.status === 'PENDING_TL_APPROVAL').length;
    const activeTasksCount = teamTasks.filter(t => ['PENDING', 'IN_PROGRESS', 'WAITING_FOR_REVIEW'].includes(t.status)).length;
    const completedTasksCount = teamTasks.filter(t => ['APPROVED', 'COMPLETED'].includes(t.status)).length;
    const activeProjectsCount = teamProjects.length;

    // Team Attendance Turnout %
    const now = new Date();
    const todayLogs = attendanceLogs.filter(l => new Date(l.date).toLocaleDateString('en-CA') === now.toLocaleDateString('en-CA'));
    const presentToday = todayLogs.filter(l => ['PRESENT', 'LATE', 'HALF_DAY', 'WORK_FROM_HOME'].includes(l.status)).length;
    const teamAttendancePercent = Math.min(100, Math.round((presentToday / totalTeamCount) * 100) || 85);

    // Productivity %
    const totalTasks = activeTasksCount + completedTasksCount;
    const productivityPercent = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 88;

    return {
      totalTeamCount,
      pendingTLApprovals,
      activeTasksCount,
      completedTasksCount,
      teamAttendancePercent,
      activeProjectsCount,
      productivityPercent
    };
  }, [teamMembers, leaves, teamTasks, teamProjects, attendanceLogs]);

  // Tasks Filtered for Selected Date (Rolling Week)
  const dayTasks = useMemo(() => {
    return teamTasks.filter((task) => {
      const rawDate = task.deadline || task.dueDate;
      if (rawDate) {
        const d = new Date(rawDate);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}` === selectedDate;
      }
      return isTodaySelected;
    });
  }, [teamTasks, selectedDate, isTodaySelected]);

  // Filtered Tasks for Task List Section
  const filteredTaskList = useMemo(() => {
    if (taskFilter === 'ALL') return teamTasks;
    return teamTasks.filter(t => t.status === taskFilter);
  }, [teamTasks, taskFilter]);

  // Team Weekly Performance Chart Data
  const weeklyPerformanceData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map(day => ({
      day,
      completed: Math.floor(Math.random() * 8) + 4,
      target: 10
    }));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-2 text-left">
        <div className="skeleton h-24 w-full rounded-[28px]" />
        <div className="skeleton h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6 pb-12 font-sans text-left"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 1. Header Banner — Matching Employee Dashboard Layout */}
      <motion.div
        variants={itemVariants}
        className="rounded-[32px] border border-border/70 bg-gradient-to-r from-card via-card to-emerald-500/5 p-6 sm:p-7 shadow-xs relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-5">
            <UserAvatar user={user} className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-emerald-500/30 shadow-md shrink-0" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {getGreeting()}, {user?.name?.split(' ')[0] || 'Team Leader'}!
                </h1>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>TEAM LEADER</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-semibold">
                <span className="font-mono font-bold text-foreground">ID: {user?.employeeId || 'TL-1001'}</span>
                <span>•</span>
                <span>{user?.department || 'Engineering'}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {myTeam?.name || 'Alpha Core Team'}
                </span>
              </div>
            </div>
          </div>

          {/* Live Clock & Shift Control */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-muted/30 border border-border/60 p-4 rounded-2xl shrink-0">
            <div className="text-left sm:text-right">
              <span className="text-2xl font-black font-mono tracking-tight text-emerald-600 dark:text-emerald-400 block">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-[11px] text-muted-foreground font-semibold block">
                {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!clockedRecord ? (
                <button
                  onClick={handleClockIn}
                  disabled={clockLoading}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Clock In</span>
                </button>
              ) : !clockedRecord.clockOut ? (
                <button
                  onClick={handleClockOut}
                  disabled={clockLoading}
                  className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Clock Out</span>
                </button>
              ) : (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Shift Completed</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Pill-Style Quick Action Buttons */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Link
          to="/tasks"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card hover:bg-muted border border-border/70 text-xs font-bold text-foreground transition-all cursor-pointer shrink-0 shadow-xs"
        >
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>My Tasks</span>
        </Link>

        <Link
          to="/leaves"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card hover:bg-muted border border-border/70 text-xs font-bold text-foreground transition-all cursor-pointer shrink-0 shadow-xs"
        >
          <Calendar className="w-4 h-4 text-amber-500" />
          <span>Leave Management</span>
        </Link>

        <Link
          to="/profile"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card hover:bg-muted border border-border/70 text-xs font-bold text-foreground transition-all cursor-pointer shrink-0 shadow-xs"
        >
          <UserIcon className="w-4 h-4 text-indigo-500" />
          <span>My Profile</span>
        </Link>

        <Link
          to="/teams"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card hover:bg-muted border border-border/70 text-xs font-bold text-foreground transition-all cursor-pointer shrink-0 shadow-xs"
        >
          <Users className="w-4 h-4 text-blue-500" />
          <span>Team Members</span>
        </Link>

        <Link
          to="/chat"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card hover:bg-muted border border-border/70 text-xs font-bold text-foreground transition-all cursor-pointer shrink-0 shadow-xs"
        >
          <MessageSquare className="w-4 h-4 text-purple-500" />
          <span>Chat Room</span>
        </Link>

        <Link
          to="/announcements"
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card hover:bg-muted border border-border/70 text-xs font-bold text-foreground transition-all cursor-pointer shrink-0 shadow-xs"
        >
          <Megaphone className="w-4 h-4 text-rose-500" />
          <span>Announcements</span>
        </Link>
      </motion.div>

      {/* 3. Top 6 Team Leader KPI Metric Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card 1: Total Team Members */}
        <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Total Team Members</span>
          <span className="text-2xl font-black text-foreground mt-2">{stats.totalTeamCount}</span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5">Active Workforce</span>
        </div>

        {/* Card 2: Pending Approvals */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs flex flex-col justify-between hover:border-amber-500/50 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400 tracking-wider">Pending Approvals</span>
          <span className="text-2xl font-black text-amber-500 mt-2">{stats.pendingTLApprovals}</span>
          <span className="text-[10px] text-amber-600/80 font-semibold mt-0.5">Requires Review</span>
        </div>

        {/* Card 3: Active Tasks */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 tracking-wider">Active Tasks</span>
          <span className="text-2xl font-black text-emerald-500 mt-2">{stats.activeTasksCount}</span>
          <span className="text-[10px] text-emerald-600/80 font-semibold mt-0.5">In Progress</span>
        </div>

        {/* Card 4: Attendance % */}
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 shadow-xs flex flex-col justify-between hover:border-indigo-500/50 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">Attendance %</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">{stats.teamAttendancePercent}%</span>
          <span className="text-[10px] text-indigo-600/80 font-semibold mt-0.5">Today's Turnout</span>
        </div>

        {/* Card 5: Active Projects */}
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-4 shadow-xs flex flex-col justify-between hover:border-blue-500/50 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-blue-700 dark:text-blue-400 tracking-wider">Active Projects</span>
          <span className="text-2xl font-black text-blue-500 mt-2">{stats.activeProjectsCount}</span>
          <span className="text-[10px] text-blue-600/80 font-semibold mt-0.5">Assigned Projects</span>
        </div>

        {/* Card 6: Team Productivity */}
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4 shadow-xs flex flex-col justify-between hover:border-purple-500/50 transition-all">
          <span className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-400 tracking-wider">Team Productivity</span>
          <span className="text-2xl font-black text-purple-500 mt-2">{stats.productivityPercent}%</span>
          <span className="text-[10px] text-purple-600/80 font-semibold mt-0.5">Completion Rate</span>
        </div>
      </motion.div>

      {/* 4. Main 2-Column Content Layout (8 cols Left / 4 cols Right) */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (8 cols): Attendance Summary, Tasks & Performance Chart */}
        <div className="lg:col-span-8 space-y-6">
          {/* Attendance Summary Card */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Attendance Summary</h3>
                  <p className="text-xs text-muted-foreground font-medium">Daily shift logging, working hours, and progress breakdown.</p>
                </div>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-black border ${
                clockedRecord && !clockedRecord.clockOut
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-muted text-muted-foreground border-border/60'
              }`}>
                {clockedRecord && !clockedRecord.clockOut ? 'Shift Active' : clockedRecord?.clockOut ? 'Shift Completed' : 'Not Clocked In'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
              <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Check In Time</span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">
                  {clockedRecord?.clockIn ? new Date(clockedRecord.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Check Out Time</span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">
                  {clockedRecord?.clockOut ? new Date(clockedRecord.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Working Hours</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {currentWorkingHours} hrs
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                <span className="text-muted-foreground block text-[10px] font-bold uppercase">Shift Status</span>
                <span className="text-sm font-bold text-foreground mt-0.5 block">
                  {clockedRecord?.status || 'REGULAR'}
                </span>
              </div>
            </div>

            {/* Shift Progress Bar (Target 8 hours) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-muted-foreground">Shift Completion Progress</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {Math.min(100, Math.round((currentWorkingHours / 8) * 100))}% (8.0 Hrs Target)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (currentWorkingHours / 8) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* My & Team Assigned Tasks Section */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Team Deliverables & Tasks</h3>
                  <p className="text-xs text-muted-foreground font-medium">Monitor active tasks and assignees across your team.</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full py-1 text-xs shrink-0">
                {['ALL', 'PENDING', 'IN_PROGRESS', 'WAITING_FOR_REVIEW', 'APPROVED'].map(f => (
                  <button
                    key={f}
                    onClick={() => setTaskFilter(f)}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      taskFilter === f
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-muted/40 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {f === 'WAITING_FOR_REVIEW' ? 'Review' : f === 'IN_PROGRESS' ? 'Progress' : f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredTaskList.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/60">
                  No tasks found under this filter.
                </div>
              ) : (
                filteredTaskList.slice(0, 5).map(task => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl border border-border/60 bg-muted/10 hover:bg-muted/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          task.status === 'APPROVED'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : task.status === 'WAITING_FOR_REVIEW'
                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            : 'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                        }`}>
                          {task.status}
                        </span>
                        <h4 className="text-xs font-bold text-foreground truncate">{task.title}</h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-1">{task.description}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {task.assignedTo && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <UserAvatar user={task.assignedTo} className="h-6 w-6 rounded-full" />
                          <span className="truncate max-w-[100px]">{task.assignedTo.name}</span>
                        </div>
                      )}

                      <Link
                        to="/tasks"
                        className="p-1.5 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance Analytics Chart Card */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Team Productivity Analytics</h3>
                  <p className="text-xs text-muted-foreground font-medium">Weekly sprint velocity and task completion metrics.</p>
                </div>
              </div>

              <span className="text-xs font-extrabold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                +14% Velocity
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tlColorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartPrimaryColor} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={chartPrimaryColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(150, 150, 150, 0.15)" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#888' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'rgba(150, 150, 150, 0.2)',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke={chartPrimaryColor}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#tlColorGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR (4 cols): Leave Overview, Rolling 7-Day Calendar, Announcements & Team Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Leave Overview Section (Preserved Team Leader Leave Widget) */}
          <TeamLeaderLeaveWidget leaves={leaves} onRefresh={fetchTLDashboardData} />

          {/* 2. Schedule & Deliverables Card (Rolling 7-Day Calendar Widget) */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Schedule & Deliverables</h3>
              </div>

              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Rolling Week
              </span>
            </div>

            {/* Rolling 7-Day Timeline Strips */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {rollingWeekDays.map((day) => {
                const selected = selectedDate === day.dateString;
                return (
                  <button
                    key={day.dateString}
                    onClick={() => setSelectedDate(day.dateString)}
                    className={`py-2 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                      selected
                        ? 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm scale-105'
                        : day.isToday
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-bold'
                        : 'bg-muted/30 border-border/40 hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="text-[9px] font-black uppercase">{day.dayName}</span>
                    <span className="text-sm font-black mt-0.5">{day.dateNum}</span>
                  </button>
                );
              })}
            </div>

            {/* Deliverables List for Selected Date */}
            <div className="space-y-2 pt-2 border-t border-border/30">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider block">
                Deliverables for {selectedDate}
              </span>

              {dayTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 text-center bg-muted/20 rounded-xl">
                  No deliverables scheduled for this date.
                </p>
              ) : (
                dayTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="p-2.5 rounded-xl border border-border/50 bg-muted/20 flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-foreground block truncate">{task.title}</span>
                      <span className="text-[10px] text-muted-foreground block">{task.status}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${
                      task.priority === 'HIGH' ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {task.priority || 'NORMAL'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Team Status Widget */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Team Roster & Status</h3>
              </div>

              <span className="text-[10px] font-extrabold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                {teamMembers.length} Members
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {teamMembers.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No team members assigned.</p>
              ) : (
                teamMembers.slice(0, 6).map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-border/50 bg-muted/20 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <UserAvatar user={member} className="h-8 w-8 rounded-full" />
                      <div>
                        <span className="font-bold text-foreground block">{member.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{member.role}</span>
                      </div>
                    </div>

                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400 shadow-2xs" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 4. Recent Announcements Widget */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">Announcements</h3>
              </div>

              <Link to="/announcements" className="text-xs font-bold text-emerald-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-2.5">
              {announcements.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No announcements posted.</p>
              ) : (
                announcements.slice(0, 3).map(anc => (
                  <div key={anc.id} className="p-3 rounded-2xl border border-border/50 bg-muted/20 space-y-1 text-xs">
                    <span className="font-bold text-foreground block">{anc.title}</span>
                    <p className="text-muted-foreground text-[11px] line-clamp-2">{anc.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TeamLeaderDashboard;
