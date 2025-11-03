"use client";

import React from 'react';
import { useSession } from '@/context/SessionContext';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
  const { session, user } = useSession(); // 'loading' is guaranteed to be false here

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Check if email is confirmed. If not, redirect to verification page.
  if (user && !user.email_confirmed_at) {
    return <Navigate to="/verify-email" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;