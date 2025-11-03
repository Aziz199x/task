"use client";

import React from 'react';
import { useSession } from '@/context/SessionContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // Import Loader2 for loading indicator

const PublicRoute: React.FC = () => {
  const { session, loading } = useSession(); // Get loading state from useSession

  if (loading) {
    // Render a loading spinner or placeholder while session is being established
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;