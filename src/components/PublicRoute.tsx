"use client";

import React from 'react';
import { useSession } from '@/context/SessionContext';
import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute: React.FC = () => {
  const { session } = useSession(); // 'loading' is guaranteed to be false here

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;