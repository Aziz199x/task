"use client";

import React from 'react';
import { useSession } from '@/context/SessionContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // Import Loader2 for loading indicator

const ProtectedRoute: React.FC = () => {
  const { session, user, loading } = useSession(); // Get loading state from useSession

  if (loading) {
    // Render a loading spinner or placeholder while session is being established
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

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