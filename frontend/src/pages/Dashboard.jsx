import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import TeamLeaderDashboard from '../components/dashboard/TeamLeaderDashboard';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';
import InternDashboard from '../components/dashboard/InternDashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user?.role) {
    case 'SUPER_ADMIN':
      return <Navigate to="/super-admin/dashboard" replace />;
    case 'ADMIN':
      return <AdminDashboard />;
    case 'TEAM_LEADER':
      return <TeamLeaderDashboard />;
    case 'EMPLOYEE':
      return <EmployeeDashboard />;
    case 'INTERN':
      return <InternDashboard />;
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <h2 className="text-xl font-bold text-danger">Unauthorized Access</h2>
          <p className="text-muted-foreground">Your role does not have an assigned dashboard.</p>
        </div>
      );
  }
};

export default Dashboard;
