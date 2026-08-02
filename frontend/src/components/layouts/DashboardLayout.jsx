import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Clock,
  Ticket,
  Megaphone,
  MessageSquare,
  BarChart3,
  History,
  User as UserIcon,
  LogOut,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Layers,
  FileText,
  Code,
  Settings,
  Calendar,
  Mail,
  HelpCircle,
  Search,
  Laptop,
  Pin,
  FolderOpen,
  Sparkles,
  Zap,
  Wrench,
  FileCode,
  ListTree
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { getUploadUrl } from '../../services/api';
import UserAvatar from '../common/UserAvatar';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentFull = location.pathname + location.search;

  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllAsRead, deleteNotification } = useSocket();
  const { companyName, companyLogo, themeMode, updateThemeSettings } = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(() => localStorage.getItem('sidebar_pinned') === 'true');
  const [isHovered, setIsHovered] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const isExpanded = isPinned || isHovered || sidebarOpen;

  const togglePin = (e) => {
    e?.stopPropagation();
    const nextPin = !isPinned;
    setIsPinned(nextPin);
    localStorage.setItem('sidebar_pinned', String(nextPin));
  };

  const profileRef = useRef(null);

  // Handle outside click, Esc key, and scroll dismissal for Profile Dropdown
  useEffect(() => {
    if (!profileOpen) return;

    const handlePointerDownOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setProfileOpen(false);
      }
    };

    const handleScroll = () => {
      setProfileOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDownOutside, true);
    document.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDownOutside, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [profileOpen]);

  // Close profile dropdown when route changes
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  // Handle popup notifications
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length > 0) {
      const latest = unread[0];
      setToastMessage({ title: latest.title, message: latest.message });
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const toggleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    updateThemeSettings({ themeMode: nextMode });
  };

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem('sidebar_collapsed', String(nextVal));
  };

  const [openCategories, setOpenCategories] = useState({
    Overview: true,
    Workspaces: true,
    Operations: true,
    'System Control': true
  });

  const toggleCategory = (title) => {
    setOpenCategories(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const categories = [
    {
      title: 'Platform Control Center',
      items: [
        { label: 'Platform Dashboard', path: '/super-admin/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN'] },
        { label: 'Branding & Theme', path: '/super-admin/branding', icon: Sparkles, roles: ['SUPER_ADMIN'] },
        { label: 'Users Directory', path: '/super-admin/users', icon: Users, roles: ['SUPER_ADMIN'] },
        { label: 'Team Directory', path: '/super-admin/teams', icon: Briefcase, roles: ['SUPER_ADMIN'] },
        { label: 'Admin Management', path: '/super-admin/admins', icon: ShieldCheck, roles: ['SUPER_ADMIN'] }
      ]
    },
    {
      title: 'Platform Builder Hub',
      items: [
        { label: 'Form Builder', path: '/super-admin/platform-builder/forms', icon: FileCode, roles: ['SUPER_ADMIN'] },
        { label: 'Menu Builder', path: '/super-admin/platform-builder/menus', icon: ListTree, roles: ['SUPER_ADMIN'] },
        { label: 'Metrics & Audit', path: '/super-admin/platform-builder/audit', icon: BarChart3, roles: ['SUPER_ADMIN'] },
        { label: 'Future Extensions', path: '/super-admin/platform-builder/extensions', icon: Layers, roles: ['SUPER_ADMIN'] }
      ]
    },
    {
      title: 'Overview',
      items: [
        { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] },
        { label: 'My Profile', path: '/profile', icon: UserIcon, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] }
      ]
    },
    {
      title: 'Workspaces',
      items: [
        { label: 'Projects', path: '/projects', icon: FolderOpen, roles: ['ADMIN', 'TEAM_LEADER'] },
        { label: 'Active Board', path: '/tasks?tab=Board', icon: Layers, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] },
        { label: 'Backlog', path: '/tasks?tab=Backlog', icon: FileText, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] },
        { label: 'Roadmap', path: '/tasks?tab=Timeline', icon: Calendar, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] },
        { label: 'Repositories', path: '/tasks?tab=Code', icon: Code, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] },
        { label: 'Integrations', path: '/tasks?tab=Development', icon: Settings, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] }
      ]
    },
    {
      title: 'Communication',
      items: [
        { label: 'Chat', path: '/chat', icon: MessageSquare, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] },
        { label: 'Announcements', path: '/announcements', icon: Megaphone, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] }
      ]
    },
    {
      title: 'AI Insights & Advisory',
      items: [
        { label: 'AI Executive Hub', path: '/ai-dashboard', icon: Sparkles, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] },
        { label: 'AI Action Center', path: '/ai-recommendations', icon: Zap, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] },
        { label: 'AI Workload Optimizer', path: '/ai-workload', icon: Users, roles: ['ADMIN', 'TEAM_LEADER'] }
      ]
    },
    {
      title: 'Analytics & Reports',
      items: [
        { label: 'Executive Analytics', path: '/analytics', icon: BarChart3, roles: ['ADMIN', 'TEAM_LEADER'] },
        { label: 'Resource Utilization', path: '/resource-utilization', icon: Users, roles: ['ADMIN', 'TEAM_LEADER'] },
        { label: 'Executive Reports', path: '/executive-reports', icon: FileText, roles: ['ADMIN', 'TEAM_LEADER'] }
      ]
    },
    {
      title: 'Operations',
      items: [
        { label: 'My Work Logs', path: '/worklogs', icon: Clock, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] },
        { label: 'Attendance Portal', path: '/attendance', icon: Clock, roles: ['INTERN', 'TEAM_LEADER', 'EMPLOYEE'] },
        { label: 'Attendance Audit', path: '/attendance-audit', icon: Clock, roles: ['ADMIN', 'TEAM_LEADER'] },
        { label: 'Leave Management', path: '/leave-management', icon: Calendar, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN', 'SUPER_ADMIN'] },
        { label: 'Ticket Desk', path: '/tickets', icon: Ticket, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] },
        { label: 'Asset Management', path: '/assets', icon: Laptop, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] }
      ]
    },
    {
      title: 'Finance & Payroll',
      items: [
        { label: 'Payroll Dashboard', path: '/payroll/dashboard', icon: BarChart3, roles: ['ADMIN', 'SUPER_ADMIN'] },
        { label: 'Salary Templates', path: '/payroll/templates', icon: FileText, roles: ['ADMIN'] },
        { label: 'Salary Structures', path: '/payroll/structures', icon: Users, roles: ['ADMIN'] },
        { label: 'Payroll Processing', path: '/payroll/processing', icon: Layers, roles: ['ADMIN'] },
        { label: 'Payslips Desk', path: '/payroll/payslips', icon: FileCode, roles: ['ADMIN'] },
        { label: 'Holiday Calendar', path: '/payroll/holidays', icon: Calendar, roles: ['ADMIN'] },
        { label: 'Payroll Reports', path: '/payroll/reports', icon: BarChart3, roles: ['ADMIN', 'SUPER_ADMIN'] },
        { label: 'Payroll Settings', path: '/payroll/settings', icon: Settings, roles: ['ADMIN'] },
        { label: 'My Payslips & Salary', path: '/my-payroll', icon: FileText, roles: ['EMPLOYEE', 'INTERN', 'TEAM_LEADER'] }
      ]
    },
    {
      title: 'System Control',
      items: [
        { label: 'Intern Registry', path: '/interns', icon: Users, roles: ['ADMIN'] },
        { label: 'Employee Registry', path: '/employees', icon: Users, roles: ['ADMIN'] },
        { label: 'Team Leader Registry', path: '/team-leaders', icon: Users, roles: ['ADMIN'] },
        { label: 'Team Hub', path: '/teams', icon: Briefcase, roles: ['ADMIN', 'EMPLOYEE', 'TEAM_LEADER', 'INTERN'] },
        { label: 'Report Center', path: '/reports', icon: BarChart3, roles: ['ADMIN', 'TEAM_LEADER'] },
        { label: 'Audit Logs', path: '/audit-logs', icon: History, roles: ['ADMIN'] },
        { label: 'Site Settings', path: '/settings', icon: ShieldCheck, roles: ['ADMIN'] }
      ]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationClick = (notif) => {
    markRead(notif.id);
    setNotifOpen(false);

    if (notif.type.startsWith('TASK')) {
      navigate('/tasks');
    } else if (notif.type.startsWith('TICKET')) {
      navigate('/tickets');
    } else if (notif.type.startsWith('NEW_ANNOUNCEMENT')) {
      navigate('/announcements');
    }
  };

  // Breadcrumb generation based on current path + query params
  const getBreadcrumbs = () => {
    const parts = [{ label: 'Portal', path: '/' }];
    const pathname = location.pathname;
    const query = new URLSearchParams(location.search);
    const tab = query.get('tab');

    if (pathname === '/profile') {
      parts.push({ label: 'My Profile', path: '/profile' });
    } else if (pathname === '/attendance') {
      parts.push({ label: 'Operations', path: '/attendance' });
      parts.push({ label: 'Attendance Portal', path: '/attendance' });
    } else if (pathname === '/attendance-audit') {
      parts.push({ label: 'Operations', path: '/attendance-audit' });
      parts.push({ label: 'Attendance Audit', path: '/attendance-audit' });
    } else if (pathname === '/interns') {
      parts.push({ label: 'System Control', path: '/interns' });
      parts.push({ label: 'Intern Registry', path: '/interns' });
    } else if (pathname === '/team-leaders') {
      parts.push({ label: 'System Control', path: '/team-leaders' });
      parts.push({ label: 'Team Leader Registry', path: '/team-leaders' });
    } else if (pathname === '/employees') {
      parts.push({ label: 'System Control', path: '/employees' });
      parts.push({ label: 'Employee Registry', path: '/employees' });
    } else if (pathname === '/teams') {
      parts.push({ label: 'System Control', path: '/teams' });
      parts.push({ label: 'Team Hub', path: '/teams' });
    } else if (pathname === '/tickets') {
      parts.push({ label: 'Operations', path: '/tickets' });
      parts.push({ label: 'Ticket Desk', path: '/tickets' });
    } else if (pathname === '/chat') {
      parts.push({ label: 'Communication', path: '/chat' });
      parts.push({ label: 'Chat', path: '/chat' });
    } else if (pathname === '/announcements') {
      parts.push({ label: 'Operations', path: '/announcements' });
      parts.push({ label: 'Announcements', path: '/announcements' });
    } else if (pathname === '/leave-management' || pathname === '/leaves') {
      parts.push({ label: 'Operations', path: '/leave-management' });
      parts.push({ label: 'Leave Management', path: '/leave-management' });
    } else if (pathname === '/reports') {
      parts.push({ label: 'System Control', path: '/reports' });
      parts.push({ label: 'Report Center', path: '/reports' });
    } else if (pathname === '/audit-logs') {
      parts.push({ label: 'System Control', path: '/audit-logs' });
      parts.push({ label: 'Audit Logs', path: '/audit-logs' });
    } else if (pathname === '/settings') {
      parts.push({ label: 'System Control', path: '/settings' });
      parts.push({ label: 'Site Settings', path: '/settings' });
    } else if (pathname === '/projects') {
      parts.push({ label: 'Workspaces', path: '/projects' });
      parts.push({ label: 'Projects', path: '/projects' });
    } else if (pathname === '/tasks') {
      parts.push({ label: 'Workspaces', path: '/tasks' });
      parts.push({ label: tab ? `${tab}` : 'Active Board', path: currentFull });
    }
    return parts;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-screen overflow-hidden theme-canvas-bg text-foreground">
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Floating Sidebar for Desktop & Mobile Drawer */}
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 280 : 100 }}
        transition={{ duration: 0.22, ease: 'easeInOut' }}
        onMouseEnter={() => !isPinned && setIsHovered(true)}
        onMouseLeave={() => !isPinned && setIsHovered(false)}
        className={`fixed inset-y-0 left-0 z-40 font-sans transition-transform duration-300 md:translate-x-0 md:relative flex flex-col justify-between p-3 select-none ${sidebarOpen ? 'translate-x-0 bg-white dark:bg-slate-900 shadow-2xl' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Top Pin / Collapse Controller Bar */}
          <div className={`w-full flex items-center mb-3 px-1 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
            {isExpanded && (
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 px-2">
                Navigation
              </span>
            )}
            <button
              type="button"
              onClick={togglePin}
              title={isPinned ? "Unpin sidebar (Enable Hover Expand)" : "Pin sidebar (Permanently Expand)"}
              className={`hidden md:flex h-9 w-9 items-center justify-center rounded-full transition-all shrink-0 ${isPinned
                ? 'bg-primary text-white shadow-md shadow-primary/30'
                : 'bg-white dark:bg-slate-900 text-muted-foreground hover:bg-primary/10 hover:text-primary border border-border/70 shadow-sm'
                }`}
            >
              <ChevronRight className={`h-4.5 w-4.5 transition-transform duration-300 ${isPinned ? 'rotate-180 text-white font-bold' : ''}`} />
            </button>
          </div>

          {/* Navigation Items grouped into floating capsule containers */}
          <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-2 scrollbar-none [&::-webkit-scrollbar]:hidden [ms-overflow-style:none] [scrollbar-width:none] font-sans max-h-[calc(100vh-4rem)]">
            {categories.map((cat) => {
              const filteredItems = cat.items.filter(item => item.roles.includes(user?.role));
              if (filteredItems.length === 0) return null;

              return (
                <div
                  key={cat.title}
                  className="bg-white dark:bg-slate-900 backdrop-blur-xl border border-border/70 rounded-[28px] p-2 shadow-sm hover:shadow-md shadow-slate-950/5 dark:shadow-black/20 transition-all flex flex-col items-center"
                >
                  {/* Section Title */}
                  {isExpanded && (
                    <div className="w-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 flex items-center justify-between">
                      <span>{cat.title}</span>
                    </div>
                  )}

                  {/* Group Items */}
                  <div className="w-full space-y-1.5 mt-0.5">
                    {filteredItems.map((item) => {
                      const Icon = item.icon;
                      const itemPathBase = item.path.split('?')[0];
                      const isActive = location.pathname === item.path || currentFull === item.path || (itemPathBase === '/tasks' && location.pathname === '/tasks' && !location.search && item.label === 'Active Board') || (item.path.endsWith('/dashboard') && location.pathname === '/super-admin/platform-builder');

                      return (
                        <Link
                          key={item.label}
                          to={item.path}
                          title={!isExpanded ? item.label : undefined}
                          className={`flex items-center text-xs transition-all relative group ${isExpanded ? 'w-full gap-3 px-3.5 py-3 rounded-2xl' : 'justify-center w-11 h-11 mx-auto rounded-full'
                            } ${isActive
                              ? 'bg-primary text-white font-bold shadow-md shadow-primary/30'
                              : 'text-muted-foreground hover:bg-primary/10 hover:text-primary font-semibold'
                            }`}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />

                          {isExpanded && (
                            <span className="truncate text-xs font-semibold">
                              {item.label}
                            </span>
                          )}

                          {isActive && isExpanded && (
                            <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-90" />
                          )}

                          {!isExpanded && (
                            <div className="absolute left-16 bg-slate-900 text-white text-xs px-2.5 py-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl font-medium">
                              {item.label}
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </motion.aside>

      {/* Main Panel */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 bg-transparent">
        {/* Extended Floating Glass App Bar Header Card */}
        <header className="sticky top-0 z-30 w-full px-2 sm:px-3 pt-3 pb-1">
          <div className="flex h-20 w-full items-center justify-between border border-border/60 bg-white dark:bg-slate-900 px-6 sm:px-8 backdrop-blur-xl shadow-lg shadow-slate-950/5 rounded-[28px] transition-all">
            {/* Left: Main Logo & Breadcrumb Navigation */}
            <div className="flex items-center gap-4 shrink-0">
              <button className="rounded-lg p-1.5 hover:bg-muted md:hidden" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </button>

              <Link to={user?.role === 'SUPER_ADMIN' ? '/super-admin/dashboard' : '/'} className="flex items-center gap-2.5 pr-3 border-r border-border/40 shrink-0">
                {companyLogo ? (
                  <img
                    src={companyLogo.startsWith('blob:') ? companyLogo : `${api.defaults.baseURL.replace('/api', '')}${companyLogo}`}
                    alt={companyName || 'Logo'}
                    className="h-9 max-w-[170px] object-contain shrink-0"
                  />
                ) : (
                  <img src="/logo.png" alt={companyName || 'INNOVEITY'} className="h-9 max-w-[170px] object-contain shrink-0" />
                )}
              </Link>

              <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <span className="text-muted-foreground/40 font-bold">/</span>}
                    <Link
                      to={crumb.path}
                      className={`hover:text-foreground capitalize ${idx === breadcrumbs.length - 1 ? 'text-foreground font-bold' : ''}`}
                    >
                      {crumb.label.toLowerCase()}
                    </Link>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Center: Extended Global Search Bar Berth (Centered) */}
            <div className="hidden md:flex flex-1 items-center justify-center max-w-2xl mx-6 sm:mx-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchQuery.trim()) {
                    navigate(`/tasks?search=${encodeURIComponent(searchQuery)}`);
                  }
                }}
                className="relative w-full"
              >
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search resources, tasks, employees, tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-2xl border border-border/60 bg-muted/40 hover:bg-muted/60 focus:bg-background focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
                />
              </form>
            </div>

            {/* Right: Tools & User Profile */}
            <div className="flex items-center gap-3 shrink-0">

              <button onClick={toggleTheme} className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all" title={themeMode === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                {themeMode === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-card animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                    <div className="absolute right-0 mt-2.5 z-40 w-80 sm:w-96 rounded-2xl border border-border/60 bg-white dark:bg-slate-900 p-4 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
                      <div className="flex items-center justify-between border-b border-border/40 pb-3">
                        <span className="text-xs font-bold">Workspace Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-[10px] text-primary hover:underline font-bold">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-border/40 py-2">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-center text-muted-foreground py-6">No notifications</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n._id || n.id}
                              className={`p-3 rounded-xl transition-colors ${n.isRead ? 'opacity-70' : 'bg-primary/5 font-medium'} hover:bg-muted/50 flex items-start justify-between gap-2 my-1 cursor-pointer`}
                              onClick={() => markRead(n._id || n.id)}
                            >
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-foreground">{n.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n._id || n.id);
                                }}
                                className="text-muted-foreground hover:text-danger p-1 rounded-lg transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(prev => !prev)}
                  className="flex items-center gap-2 rounded-xl p-1 hover:bg-muted transition-all select-none"
                >
                  <UserAvatar
                    src={user?.profilePicture}
                    name={user?.name}
                    className="h-8 w-8 rounded-xl object-cover ring-2 ring-primary/20"
                  />
                  <div className="hidden text-left md:block pr-1">
                    <p className="text-xs font-extrabold leading-none">{user?.name}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5 capitalize leading-none">
                      {user?.role === 'ADMIN' ? 'Admin' : user?.role === 'TEAM_LEADER' ? 'Team Leader' : user?.role}
                    </p>
                  </div>
                  <ChevronDown size={14} className={`text-muted-foreground hidden sm:inline-block transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2.5 z-50 w-56 rounded-2xl border border-border/60 bg-white dark:bg-slate-900 p-2 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 select-none">
                    <div className="px-3 py-2.5 border-b border-border/30 mb-1.5 text-left">
                      <p className="text-xs font-bold text-foreground">{user?.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                      <span className="mt-1.5 inline-block text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded font-extrabold uppercase">
                        {user?.role === 'ADMIN' ? 'ADMIN' : user?.role === 'TEAM_LEADER' ? 'TEAM LEADER' : user?.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground font-semibold transition-colors"
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>My Profile</span>
                    </Link>

                    {user?.role === 'ADMIN' && (
                      <Link
                        to="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground font-semibold transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Site Settings</span>
                      </Link>
                    )}

                    <hr className="my-1 border-border/40" />

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-danger hover:bg-danger/5 font-bold transition-colors text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic content rendering with unified ambient background */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0 overflow-y-auto px-4 sm:px-6 pt-2 pb-4 bg-transparent">
          {children}
        </main>
      </div>

      {/* Toast Alert Popup */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-sm gap-3 rounded-2xl border border-primary/20 bg-card p-4 shadow-2xl animate-in slide-in-from-bottom duration-300 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-5 w-5 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">{toastMessage.title}</h4>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{toastMessage.message}</p>
          </div>
          <button onClick={() => setToastMessage(null)} className="ml-auto rounded-lg p-1 hover:bg-muted self-start">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
