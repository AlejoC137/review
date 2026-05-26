import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function AdminProtectedRoute({ children }) {
  const { user, isAdmin, isBimManager, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-[#fcf9f4] flex items-center justify-center font-mono text-[#1c1c19]">VERIFYING_CREDENTIALS...</div>;
  }

  if (!user || (!isAdmin && !isBimManager)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
